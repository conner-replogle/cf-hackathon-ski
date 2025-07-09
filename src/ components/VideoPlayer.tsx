

export const VideoPlayer = () => {


  
  return (
    <div className="video-player">
      <h2>Video Player</h2>
      <video controls>
        <source src="/path/to/video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}