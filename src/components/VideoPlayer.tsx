import { useState, useRef, useEffect, useCallback } from 'react'

interface Turn{
    turn_id: number
    turn_name: string
    event_id: number
    athlete_id: number
    r2_video_link: string
}

interface VideoSegment {
  turn: Turn
  startTime: number
  endTime: number
  duration: number
}

export const VideoPlayer = ({turns}: {turns: Turn[]}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Load video durations and calculate segments
  useEffect(() => {
    const loadVideoDurations = async () => {
      const durations: number[] = []
      const segments: VideoSegment[] = []
      let currentStartTime = 0

      for (const turn of turns) {
        try {
          // Create a temporary video element to get duration
          const tempVideo = document.createElement('video')
          tempVideo.preload = 'metadata'
          
          const duration = await new Promise<number>((resolve) => {
            tempVideo.onloadedmetadata = () => {
              resolve(tempVideo.duration || 10) // Default to 10 seconds if duration not available
            }
            tempVideo.onerror = () => {
              resolve(10) // Default duration on error
            }
            tempVideo.src = "/api/videos/"+turn.r2_video_link
          })

          durations.push(duration)
          segments.push({
            turn,
            startTime: currentStartTime,
            endTime: currentStartTime + duration,
            duration
          })
          currentStartTime += duration
        } catch {
          // Fallback duration
          const fallbackDuration = 10
          durations.push(fallbackDuration)
          segments.push({
            turn,
            startTime: currentStartTime,
            endTime: currentStartTime + fallbackDuration,
            duration: fallbackDuration
          })
          currentStartTime += fallbackDuration
        }
      }

      setVideoSegments(segments)
      setTotalDuration(currentStartTime)
    }

    if (turns.length > 0) {
      loadVideoDurations()
    }
  }, [turns])



  // Handle timeline scrubbing to specific time
  const handleTimelineSeek = useCallback((targetTime: number) => {
    // Set seeking flag to prevent timeupdate conflicts
    setIsSeeking(true)
    
    // Find which video segment contains this time
    let segmentIndex = videoSegments.findIndex(
      segment => targetTime >= segment.startTime && targetTime < segment.endTime
    )

    // Handle case where user clicks exactly at the end of the timeline
    if (segmentIndex === -1 && targetTime === totalDuration && totalDuration > 0) {
      segmentIndex = videoSegments.length - 1
    }

    if (segmentIndex !== -1) {
      const segment = videoSegments[segmentIndex]
      const relativeTime = targetTime - segment.startTime
      
      // Update current time immediately for smooth feedback
      setCurrentTime(targetTime)
      
      const seekAndPlay = (videoElement: HTMLVideoElement) => {
        // Clamp currentTime to video duration to avoid errors
        videoElement.currentTime = Math.min(relativeTime, videoElement.duration)
        videoElement.play()
        // isSeeking will be set to false on the 'onSeeked' event
      }

      // Switch to the correct video if needed
      if (segmentIndex !== currentVideoIndex) {
        setCurrentVideoIndex(segmentIndex)
        // Wait for video to load before seeking
        setTimeout(() => {
          if (videoRef.current) {
            seekAndPlay(videoRef.current)
          } else {
            setIsSeeking(false)
          }
        }, 100) // A small delay to allow the new video to load
      } else {
        // Same video, just seek immediately
        if (videoRef.current) {
          seekAndPlay(videoRef.current)
        } else {
          setIsSeeking(false)
        }
      }
    } else {
      // Clear seeking flag if no valid segment found
      setIsSeeking(false)
    }
  }, [videoSegments, currentVideoIndex, totalDuration])

  // Convert time to formatted string
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }


  // Handle video end - play next video
  const handleVideoEnd = () => {
    console.log('Video ended, playing next video')
    if (currentVideoIndex < turns.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    } else {
      // Restart from the beginning when all videos are played
      setCurrentVideoIndex(0)
    }
  }

  // Handle manual video selection
  const handleVideoSelect = (index: number) => {
    if (videoSegments[index]) {
      handleTimelineSeek(videoSegments[index].startTime);
    }
  }

  // Handle timeline scrubbing click
  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    console.log('Timeline clicked')
    const timeline = event.currentTarget
    const rect = timeline.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    const targetTime = percentage * totalDuration
    handleTimelineSeek(targetTime)
  }



  // Add global mouse events for dragging


  if (turns.length === 0) {
    return (
      <div className="video-player">
        <h2>Video Player</h2>
        <p>No videos available</p>
      </div>
    )
  }

  const currentVideo = turns[currentVideoIndex]

  return (
    <div className="video-player">
      <h2>Video Player</h2>
      
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          onEnded={handleVideoEnd}
          onSeeked={() => setIsSeeking(false)}
          key={currentVideo.turn_id} // Force re-render when video changes
           src={"/api/videos/"+currentVideo.r2_video_link}
           onTimeUpdate={() => {
             if (videoRef.current && !isSeeking) {
               const segment = videoSegments[currentVideoIndex];
               if (segment) {
                 setCurrentTime(segment.startTime + videoRef.current.currentTime);
               }
             }
           }}
        />
        
        <div className="video-info">
          <h3>{currentVideo.turn_name}</h3>
          <p>Video {currentVideoIndex + 1} of {turns.length}</p>
          <div className="time-display">
            <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
            Controls: ← → (5s), Shift+← → (0.1s), Space (play/pause), Home/End (start/end), Click/drag timeline
          </p>
        </div>
        
        <div className="video-timeline">
          <div className="timeline-header">
            <span className="timeline-title">Timeline</span>
            <span className="timeline-duration">{formatTime(totalDuration)} total</span>
          </div>
          
          {/* Time markers */}
          {totalDuration > 0 && (
            <div className="timeline-markers">
              {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }, (_, i) => i * 10).map(time => (
                <div
                  key={time}
                  className="time-marker"
                  style={{ left: `${(time / totalDuration) * 100}%` }}
                >
                  <span className="time-label">{formatTime(time)}</span>
                </div>
              ))}
            </div>
          )}
          
          <div 
            className="timeline-container"
            // onMouseDown={handleTimelineMouseDown}
            // onMouseMove={handleTimelineHover}
            // onMouseLeave={handleTimelineLeave}
            onClick={handleTimelineClick}
            style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
          >
            <div className="timeline-progress" style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}></div>
            
            {/* Hover time preview */}
            {hoverTime !== null && !isDragging && (
              <div
                className="timeline-hover-preview"
                style={{ left: `${(hoverTime / totalDuration) * 100}%` }}
              >
                <div className="hover-time">{formatTime(hoverTime)}</div>
              </div>
            )}
            
            {/* Current time playhead */}
            {totalDuration > 0 && (
              <div
                className="timeline-playhead"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className="playhead-indicator"></div>
                <div className="playhead-time">{formatTime(currentTime)}</div>
              </div>
            )}
            
            <div className="timeline-track" style={{ position: 'relative', height: '60px' }}>
              {videoSegments.map((segment, index) => (
                <div
                  key={segment.turn.turn_id}
                  className={`timeline-segment ${index === currentVideoIndex ? 'active' : ''}`}
                  style={{ 
                    position: 'absolute',
                    left: `${totalDuration > 0 ? (segment.startTime / totalDuration) * 100 : 0}%`,
                    width: `${totalDuration > 0 ? (segment.duration / totalDuration) * 100 : 100 / videoSegments.length}%`,
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTimelineSeek(segment.startTime)
                  }}
                  title={`${segment.turn.turn_name} (${formatTime(segment.duration)})`}
                >
                  <div className="timeline-marker"></div>
                  <div className="timeline-label">{segment.turn.turn_name}</div>
                  <div className="timeline-duration-label">{formatTime(segment.duration)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="playlist">
        <h3>Playlist</h3>
        <ul>
          {turns.map((turn, index) => (
            <li
              key={turn.turn_id}
              className={index === currentVideoIndex ? 'current' : ''}
              onClick={() => handleVideoSelect(index)}
              style={{ cursor: 'pointer' }}
            >
              {index + 1}. {turn.turn_name}
              {index === currentVideoIndex && ' (Now Playing)'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}