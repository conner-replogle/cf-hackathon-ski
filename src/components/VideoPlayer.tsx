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

  // Update current time based on video playback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      // Don't update if we're currently seeking to avoid conflicts
      if (isSeeking) return
      
      const videoCurrentTime = video.currentTime
      const segment = videoSegments[currentVideoIndex]
      if (segment) {
        setCurrentTime(segment.startTime + videoCurrentTime)
      }
    }

    const handleSeeked = () => {
      // When video finishes seeking, update the time and clear the seeking flag
      const videoCurrentTime = video.currentTime
      const segment = videoSegments[currentVideoIndex]
      if (segment) {
        setCurrentTime(segment.startTime + videoCurrentTime)
      }
      setIsSeeking(false)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('seeked', handleSeeked)
    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [currentVideoIndex, videoSegments, isSeeking])

  // Handle timeline scrubbing to specific time
  const handleTimelineSeek = useCallback((targetTime: number) => {
    // Set seeking flag to prevent timeupdate conflicts
    setIsSeeking(true)
    
    // Find which video segment contains this time
    const segmentIndex = videoSegments.findIndex(
      segment => targetTime >= segment.startTime && targetTime <= segment.endTime
    )

    if (segmentIndex !== -1) {
      const segment = videoSegments[segmentIndex]
      const relativeTime = targetTime - segment.startTime
      
      // Update current time immediately for smooth feedback
      setCurrentTime(targetTime)
      
      // Switch to the correct video if needed
      if (segmentIndex !== currentVideoIndex) {
        setCurrentVideoIndex(segmentIndex)
        // Wait for video to load before seeking
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = relativeTime
            // The 'seeked' event will clear the seeking flag
          }
        }, 50)
      } else {
        // Same video, just seek immediately
        if (videoRef.current) {
          // Only seek if we're actually changing position
          const currentVideoTime = videoRef.current.currentTime
          if (Math.abs(currentVideoTime - relativeTime) > 0.1) {
            videoRef.current.currentTime = relativeTime
            // The 'seeked' event will clear the seeking flag
          } else {
            // If we're not actually seeking, clear the flag immediately
            setIsSeeking(false)
          }
        } else {
          // No video element, clear the flag
          setIsSeeking(false)
        }
      }
    } else {
      // Clear seeking flag if no valid segment found
      setIsSeeking(false)
    }
  }, [videoSegments, currentVideoIndex])

  // Convert time to formatted string
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Add keyboard navigation for timeline scrubbing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          if (event.shiftKey) {
            // Frame-by-frame: Skip back 0.1 seconds with Shift+Left
            handleTimelineSeek(Math.max(0, currentTime - 0.1))
          } else {
            // Skip back 5 seconds
            handleTimelineSeek(Math.max(0, currentTime - 5))
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (event.shiftKey) {
            // Frame-by-frame: Skip forward 0.1 seconds with Shift+Right
            handleTimelineSeek(Math.min(totalDuration, currentTime + 0.1))
          } else {
            // Skip forward 5 seconds
            handleTimelineSeek(Math.min(totalDuration, currentTime + 5))
          }
          break
        case ' ': // Spacebar
          event.preventDefault()
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play()
            } else {
              videoRef.current.pause()
            }
          }
          break
        case 'Home':
          event.preventDefault()
          handleTimelineSeek(0)
          break
        case 'End':
          event.preventDefault()
          handleTimelineSeek(totalDuration)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTime, totalDuration, handleTimelineSeek])

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
    setCurrentVideoIndex(index)
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

  // // Handle timeline mouse down for dragging
  const handleTimelineMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleTimelineClick(event)
  }

  // Handle timeline mouse move for dragging
  const handleTimelineMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return
    
    const timeline = document.querySelector('.timeline-container') as HTMLElement
    if (!timeline) return
    
    const rect = timeline.getBoundingClientRect()
    const moveX = event.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, moveX / rect.width))
    const targetTime = percentage * totalDuration
    handleTimelineSeek(targetTime)
  }, [isDragging, totalDuration, handleTimelineSeek])

  // Handle timeline hover for time preview
  const handleTimelineHover = (event: React.MouseEvent<HTMLDivElement>) => {
    const timeline = event.currentTarget
    const rect = timeline.getBoundingClientRect()
    const hoverX = event.clientX - rect.left
    const percentage = hoverX / rect.width
    const timeAtHover = percentage * totalDuration
    setHoverTime(timeAtHover)
  }

  // Handle timeline leave to hide hover
  const handleTimelineLeave = () => {
    setHoverTime(null)
  }

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleTimelineMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleTimelineMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleTimelineMouseMove, handleMouseUp])

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
          controls
          autoPlay
          onEnded={handleVideoEnd}
          key={currentVideo.turn_id} // Force re-render when video changes
        >
          <source src={"/api/videos/"+currentVideo.r2_video_link} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
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
            onMouseDown={handleTimelineMouseDown}
            onMouseMove={handleTimelineHover}
            onMouseLeave={handleTimelineLeave}
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
            
            <div className="timeline-track">
              {videoSegments.map((segment, index) => (
                <div
                  key={segment.turn.turn_id}
                  className={`timeline-segment ${index === currentVideoIndex ? 'active' : ''}`}
                  style={{ 
                    width: `${totalDuration > 0 ? (segment.duration / totalDuration) * 100 : 100 / videoSegments.length}%`,
                    cursor: 'pointer'
                  }}
                  // onClick={(e) => {
                  //   e.stopPropagation()
                  //   handleTimelineSeek(segment.startTime)
                  // }}
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