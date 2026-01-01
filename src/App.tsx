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
import RoomAssignmentsPage from './pages/RoomAssignmentsPage';
import RoomSelectionsPage from './pages/RoomSelectionsPage';
import AdminRegistrationsPage from './pages/AdminRegistrationsPage';
import AdminRiderPreferencesPage from './pages/AdminRiderPreferencesPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ToursPage from './pages/ToursPage';
import WaitlistPage from './pages/WaitlistPage';
import SupportPage from './pages/SupportPage';
import CacheHelpPage from './pages/CacheHelpPage';
import TermsAgreementPage from './pages/TermsAgreementPage';
import TourUpdateEmailPage from './pages/TourUpdateEmailPage';
import RegistrationCleanupPage from './pages/RegistrationCleanupPage';
import DataIntegrityPage from './pages/DataIntegrityPage';
import HeadshotsPage from './pages/HeadshotsPage';
// NEW EMAIL SYSTEM (isolated - delete this line to remove)
import EmailSystemPage from './pages/EmailSystemPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/itinerary" element={<ItineraryPage />} />
            <Route path="/discussion" element={<DiscussionPage />} />
            <Route path="/participants" element={<ParticipantsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/nightly-config" element={<NightlyConfigPage />} />
            <Route path="/admin/email-templates" element={<EmailTemplatesPage />} />
            <Route path="/admin/room-assignments" element={<RoomAssignmentsPage />} />
            <Route path="/admin/room-selections" element={<RoomSelectionsPage />} />
            <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
            <Route path="/admin/rider-preferences" element={<AdminRiderPreferencesPage />} />
            <Route path="/admin/tour-update-email" element={<TourUpdateEmailPage />} />
            <Route path="/admin/registration-cleanup" element={<RegistrationCleanupPage />} />
            <Route path="/admin/data-integrity" element={<DataIntegrityPage />} />
            <Route path="/admin/headshots" element={<HeadshotsPage />} />
            {/* NEW EMAIL SYSTEM (isolated - delete this line to remove) */}
            <Route path="/admin/email-system" element={<EmailSystemPage />} />
            <Route path="/my-selections" element={<AccommodationSelectPage />} />
            <Route path="/my-documents" element={<RiderDocumentsPage />} />
            <Route path="/my-ledger" element={<MyLedgerPage />} />
            <Route path="/my-profile" element={<MyProfilePage />} />
            <Route path="/guide" element={<UserGuidePage />} />
            <Route path="/logistics" element={<TourLogisticsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/cache-help" element={<CacheHelpPage />} />
            <Route path="/agree" element={<TermsAgreementPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
