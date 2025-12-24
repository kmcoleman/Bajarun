/**
 * Notifications page - Push notification feed.
 */

import { useState, useEffect } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useOfflineData } from '../hooks/useOfflineData';
import {
  requestNotificationPermission,
  areNotificationsEnabled,
  getPushSupportStatus,
} from '../lib/fcm';

export function NotificationsPage() {
  const { user } = useAuth();
  const { announcements, loading, syncing, refresh } = useOfflineData(user?.uid || null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    const status = getPushSupportStatus();
    setNotificationsSupported(status.supported);
    setSupportMessage(status.message);
    setNotificationsEnabled(areNotificationsEnabled());
  }, []);

  const handleEnableNotifications = async () => {
    if (!user) return;
    setEnabling(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        setNotificationsEnabled(true);
      }
    } finally {
      setEnabling(false);
    }
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Layout title="Notifications" currentPath="/notifications">
      {/* Notifications toggle or unsupported message */}
      {notificationsSupported ? (
        <div className={`border-b p-4 ${notificationsEnabled ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-sm font-medium ${notificationsEnabled ? 'text-green-900' : 'text-blue-900'}`}>
                Push notifications
              </p>
              <p className={`text-xs ${notificationsEnabled ? 'text-green-700' : 'text-blue-700'}`}>
                {notificationsEnabled ? 'Notifications are enabled' : 'Get notified of important updates'}
              </p>
            </div>
            <button
              onClick={handleEnableNotifications}
              disabled={enabling}
              className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap ${
                notificationsEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {enabling ? 'Registering...' : notificationsEnabled ? 'Re-register' : 'Enable'}
            </button>
          </div>
        </div>
      ) : supportMessage && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">{supportMessage}</p>
        </div>
      )}

      {/* Header with refresh */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
        <span className="text-sm text-gray-500">
          {announcements.length} notification{announcements.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={handleRefresh}
          disabled={syncing}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {/* Notifications list */}
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading notifications...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <span className="text-4xl mb-4 block">🔔</span>
            <p>No notifications yet</p>
            <p className="text-sm mt-2">Announcements will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${
                  announcement.priority === 'high'
                    ? 'border-red-500'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {announcement.priority === 'high' && (
                      <span className="text-red-500 mr-1">!</span>
                    )}
                    {announcement.title}
                  </h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(announcement.createdAt)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-2">{announcement.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
