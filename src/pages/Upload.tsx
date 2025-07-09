import { useState } from 'react';
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

export default function Upload() {
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleFileUpload = () => {
    setUploadStatus('Video uploaded successfully!');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  const handleUploadError = () => {
    setUploadStatus('Upload failed. Please try again.');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  return (
    <div className="upload-page">
      <h2>Upload Videos</h2>
      <p>Select video files to upload to your library.</p>
      
      <div className="upload-section">
        <FilePond
          server="/api/upload"
          name="video"
          labelIdle='Drag & Drop your video files or <span class="filepond--label-action">Browse</span>'
          acceptedFileTypes={['video/*']}
          onprocessfile={handleFileUpload}
          onprocessfilerevert={handleUploadError}
          allowMultiple={true}
          maxFiles={10}
        />
        
        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.includes('successfully') ? 'success' : 'error'}`}>
            {uploadStatus}
          </div>
        )}
      </div>
      
      <div className="upload-info">
        <h3>Supported Formats</h3>
        <ul>
          <li>MP4 (.mp4)</li>
          <li>WebM (.webm)</li>
          <li>OGV (.ogv)</li>
          <li>AVI (.avi)</li>
          <li>MOV (.mov)</li>
        </ul>
        
        <h3>Upload Tips</h3>
        <ul>
          <li>Maximum file size: 500MB per video</li>
          <li>You can upload multiple videos at once</li>
          <li>Videos will be automatically added to your library</li>
        </ul>
      </div>
    </div>
  );
}
