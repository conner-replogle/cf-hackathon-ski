import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Video from "./pages/watch/Video";
import "./App.css";

import { SelectEventPage } from "./pages/upload/SelectEventPage";
import SelectTrailAndTurnPage from "./pages/upload/SelectTrailAndTurn";
import SelectVideoPage from "./pages/upload/SelectVideo";
import { SelectEventPage as WatchSelectEventPage } from "./pages/watch/SelectEventPage";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./services/api";
import { Watch } from "./pages/watch";
import { Admin } from "./pages/admin/Admin";
import { Toaster } from "./components/ui/sonner";

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
            <Route path="watch">
              <Route path="event" element={<WatchSelectEventPage />} />
              <Route index element={<Watch />} />
              <Route path=":runId" element={<Video />} />
            </Route>
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </Router>

      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
