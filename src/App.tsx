import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import SignalCleanse from './pages/SignalCleanse';
import SafetySentinel from './pages/SafetySentinel';
import ElasticItinerary from './pages/ElasticItinerary';
import CinematicMemories from './pages/CinematicMemories';
import TripPlanner from './pages/TripPlanner';

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/signal-cleanse" element={<SignalCleanse />} />
          <Route path="/safety" element={<SafetySentinel />} />
          <Route path="/itinerary" element={<ElasticItinerary />} />
          <Route path="/memories" element={<CinematicMemories />} />
          <Route path="/trip-planner" element={<TripPlanner />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App
