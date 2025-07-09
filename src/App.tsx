import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Watch from './pages/Watch';
import './App.css';
import ConnerTest from './pages/ConnerTest';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path=":eventId/upload" element={<Upload />} />
          <Route path=":eventId/watch" element={<Watch />} />
          <Route path="conner" element={<ConnerTest />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
