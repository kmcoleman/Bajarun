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
import AdminPage from './pages/AdminPage';
import NightlyConfigPage from './pages/NightlyConfigPage';
import AccommodationSelectPage from './pages/AccommodationSelectPage';
import RiderDocumentsPage from './pages/RiderDocumentsPage';
import TourLogisticsPage from './pages/TourLogisticsPage';
import MyLedgerPage from './pages/MyLedgerPage';
import MyProfilePage from './pages/MyProfilePage';
import UserGuidePage from './pages/UserGuidePage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';

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
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/nightly-config" element={<NightlyConfigPage />} />
            <Route path="/admin/email-templates" element={<EmailTemplatesPage />} />
            <Route path="/my-selections" element={<AccommodationSelectPage />} />
            <Route path="/my-documents" element={<RiderDocumentsPage />} />
            <Route path="/my-ledger" element={<MyLedgerPage />} />
            <Route path="/my-profile" element={<MyProfilePage />} />
            <Route path="/guide" element={<UserGuidePage />} />
            <Route path="/logistics" element={<TourLogisticsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
