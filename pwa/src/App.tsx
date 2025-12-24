/**
 * Main App component with routing.
 */

import Router, { Route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { DailyPage } from './pages/DailyPage';
import { RosterPage } from './pages/RosterPage';
import { InfoPage } from './pages/InfoPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminSendPage } from './pages/AdminSendPage';
import { setupForegroundMessaging } from './lib/fcm';

export function App() {
  const { loading, isAuthenticated } = useAuth();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  // Set up foreground message handling
  useEffect(() => {
    if (isAuthenticated) {
      setupForegroundMessaging((payload) => {
        console.log('Foreground notification:', payload);
        setToast(payload);
        // Auto-hide after 5 seconds
        setTimeout(() => setToast(null), 5000);
      });
    }
  }, [isAuthenticated]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-baja-dark flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated - show main app
  return (
    <>
      <Router>
        <Route path="/" component={DailyPage} />
        <Route path="/roster" component={RosterPage} />
        <Route path="/info" component={InfoPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/admin" component={AdminSendPage} />
      </Router>

      {/* Toast notification for foreground messages */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-pulse">
          <div
            className="bg-blue-600 text-white p-4 rounded-xl shadow-lg max-w-md mx-auto cursor-pointer"
            onClick={() => setToast(null)}
          >
            <div className="font-semibold">{toast.title}</div>
            <div className="text-sm text-blue-100 mt-1">{toast.body}</div>
          </div>
        </div>
      )}
    </>
  );
}
