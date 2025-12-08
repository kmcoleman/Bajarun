/**
 * App.tsx
 *
 * Main application component with routing.
 * BMW Baja Tour 2025 Website
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ItineraryPage from './pages/ItineraryPage';
import DiscussionPage from './pages/DiscussionPage';
import ParticipantsPage from './pages/ParticipantsPage';
import FAQPage from './pages/FAQPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/itinerary" element={<ItineraryPage />} />
            <Route path="/discussion" element={<DiscussionPage />} />
            <Route path="/participants" element={<ParticipantsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
