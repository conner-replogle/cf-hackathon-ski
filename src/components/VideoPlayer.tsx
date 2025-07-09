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
            tempVideo.src = turn.r2_video_link
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
    const timeline = event.currentTarget
    const rect = timeline.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    const targetTime = percentage * totalDuration
    handleTimelineSeek(targetTime)
  }

  // Handle timeline mouse down for dragging
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
      <div className="max-w-6xl mx-auto p-8">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Video Player</h2>
        <p className="text-white text-center text-lg">No videos available</p>
      </div>
    )
  }

  const currentVideo = turns[currentVideoIndex]

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Video Player</h2>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-lg">
        <video
          ref={videoRef}
          controls
          autoPlay
          onEnded={handleVideoEnd}
          key={currentVideo.turn_id} // Force re-render when video changes
          className="w-full max-w-4xl h-auto rounded-lg bg-black mx-auto block"
        >
          <source src={"/api/videos/"+currentVideo.r2_video_link} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="my-4 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{currentVideo.turn_name}</h3>
          <p className="text-gray-600 text-sm">Video {currentVideoIndex + 1} of {turns.length}</p>
          <div className="font-mono text-lg text-blue-600 font-semibold my-2">
            <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Controls: ← → (5s), Shift+← → (0.1s), Space (play/pause), Home/End (start/end), Click/drag timeline
          </p>
        </div>
        
        <div className="my-4 py-4">
          <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Timeline</span>
            <span className="bg-gray-200 px-2 py-1 rounded font-mono">{formatTime(totalDuration)} total</span>
          </div>
          
          {/* Time markers */}
          {totalDuration > 0 && (
            <div className="relative h-5 mb-2 border-b border-gray-300">
              {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }, (_, i) => i * 10).map(time => (
                <div
                  key={time}
                  className="absolute top-0 h-full border-l border-gray-400 pointer-events-none"
                  style={{ left: `${(time / totalDuration) * 100}%` }}
                >
                  <span className="absolute top-0.5 left-0.5 text-xs text-gray-600 font-mono bg-white/90 px-1 border border-gray-300 rounded whitespace-nowrap">
                    {formatTime(time)}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div 
            className={`relative w-full h-24 bg-gray-200 rounded-lg border border-gray-300 overflow-hidden select-none transition-all duration-100 ${isDragging ? 'cursor-grabbing border-blue-500 shadow-lg shadow-blue-500/25' : 'cursor-pointer'} active:border-blue-500 active:shadow-lg active:shadow-blue-500/25`}
            onMouseDown={handleTimelineMouseDown}
            onMouseMove={handleTimelineHover}
            onMouseLeave={handleTimelineLeave}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-100 z-10 shadow-inner shadow-white/30" 
              style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
            ></div>
            
            {/* Hover time preview */}
            {hoverTime !== null && !isDragging && (
              <div
                className="absolute top-0 h-full z-20 pointer-events-none transform -translate-x-px"
                style={{ left: `${(hoverTime / totalDuration) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap shadow-lg">
                  {formatTime(hoverTime)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-black/80"></div>
                </div>
              </div>
            )}
            
            {/* Current time playhead */}
            {totalDuration > 0 && (
              <div
                className={`absolute top-0 h-full z-30 pointer-events-none transform -translate-x-px transition-transform duration-100 ${isDragging ? 'scale-110' : ''}`}
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className={`h-full bg-red-500 shadow-lg shadow-red-500/50 transition-all duration-100 ${isDragging ? 'w-0.5 shadow-red-500/70' : 'w-0.5'}`}></div>
                <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap shadow-lg transition-all duration-100 ${isDragging ? 'bg-red-400 px-3 py-1.5 text-sm font-bold -top-7' : ''}`}>
                  {formatTime(currentTime)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-red-500"></div>
                </div>
              </div>
            )}
            
            <div className="relative flex h-full z-20">
              {videoSegments.map((segment, index) => (
                <div
                  key={segment.turn.turn_id}
                  className={`relative flex flex-col items-center justify-center h-full border-r border-gray-300 last:border-r-0 transition-all duration-200 bg-white/10 px-1 py-2 ${
                    index === currentVideoIndex 
                      ? 'bg-white/50 shadow-inner shadow-white/70 border-l-2 border-r-2 border-blue-500' 
                      : 'hover:bg-white/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10'
                  }`}
                  style={{ 
                    width: `${totalDuration > 0 ? (segment.duration / totalDuration) * 100 : 100 / videoSegments.length}%`,
                    cursor: 'pointer'
                  }}
                  title={`${segment.turn.turn_name} (${formatTime(segment.duration)})`}
                >
                  <div className={`w-2 h-2 rounded-full mb-1 transition-all duration-200 ${
                    index === currentVideoIndex 
                      ? 'bg-white shadow-lg shadow-blue-500' 
                      : 'bg-gray-800 hover:bg-blue-500 hover:scale-125'
                  }`}></div>
                  <div className={`text-xs text-center line-height-tight px-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-medium mb-0.5 transition-all duration-200 ${
                    index === currentVideoIndex 
                      ? 'text-white font-semibold' 
                      : 'text-gray-800 hover:text-blue-500'
                  }`}>
                    {segment.turn.turn_name}
                  </div>
                  <div className={`text-xs font-mono px-1 py-0.5 rounded border transition-all duration-200 ${
                    index === currentVideoIndex 
                      ? 'bg-white/90 text-gray-800 border-white/60' 
                      : 'bg-white/80 text-gray-600 border-gray-300 hover:bg-white/95 hover:border-blue-500'
                  }`}>
                    {formatTime(segment.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Playlist</h3>
        <ul className="list-none p-0 m-0">
          {turns.map((turn, index) => (
            <li
              key={turn.turn_id}
              className={`p-3 my-1 rounded border transition-all duration-200 cursor-pointer ${
                index === currentVideoIndex 
                  ? 'bg-blue-500 text-white border-blue-700 font-medium hover:bg-blue-700' 
                  : 'bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-500'
              }`}
              onClick={() => handleVideoSelect(index)}
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