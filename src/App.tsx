import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import "./App.css";

import { Admin } from "./pages/admin/Admin";
import SelectEventPage from "./pages/upload/SelectEvent";
import SelectTrailAndTurnPage from "./pages/upload/SelectTrailAndTurn";
import SelectVideoPage from "./pages/upload/SelectVideo";

import {
  QueryClientProvider,
} from '@tanstack/react-query'
import { queryClient } from "./services/api";



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="upload">
              <Route index element={<SelectEventPage />} />
              <Route path="event" element={<SelectEventPage />} />
              <Route path="trailandturn" element={<SelectTrailAndTurnPage />} />
              <Route path="video" element={<SelectVideoPage />} />
            </Route>
            <Route path="watch/:runId" element={<Watch />} />
            <Route path="admin" element={<Admin />} />
          </Route>
      </Routes>
    </Router>
    </QueryClientProvider>
  );
}

export default App;
