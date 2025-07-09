import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import 'filepond/dist/filepond.min.css'
import './App.css'
import { FilePond } from 'react-filepond';
function App() {
  const [name, setName] = useState("unknown");



  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <FilePond
        server="/api/upload"
        name="video" /* sets the file input name, it's filepond by default */
        
        labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
      />
     
    </>
  )
}

export default App
