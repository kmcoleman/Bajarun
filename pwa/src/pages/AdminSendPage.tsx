/**
 * Admin page for sending push notifications.
 */

import { useState } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { route } from 'preact-router';

// Admin UID - must match the one in Cloud Functions
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

export function AdminSendPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.uid === ADMIN_UID;

  const handleSend = async (e: Event) => {
    e.preventDefault();
    if (!title || !body) return;

    setSending(true);
    setResult(null);
    setError(null);

    try {
      const functions = getFunctions();
      const sendPushNotification = httpsCallable(functions, 'sendPushNotification');

      const response = await sendPushNotification({ title, body, priority });
      const data = response.data as { sent: number; failed: number };

      setResult(data);
      setTitle('');
      setBody('');
      setPriority('normal');
    } catch (err) {
      console.error('Failed to send notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  // Not admin - show access denied
  if (!isAdmin) {
    return (
      <Layout title="Admin" currentPath="/admin">
        <div className="p-4 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <button
            onClick={() => route('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Send Notification" currentPath="/admin">
      <div className="p-4">
        <form onSubmit={handleSend} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              placeholder="Notification title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
              placeholder="Notification message"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="normal"
                  checked={priority === 'normal'}
                  onChange={() => setPriority('normal')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Normal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="high"
                  checked={priority === 'high'}
                  onChange={() => setPriority('high')}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-sm text-gray-700">High (with sound)</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={sending || !title || !body}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Notification sent!</p>
            <p className="text-green-600 text-sm mt-1">
              Delivered to {result.sent} device{result.sent !== 1 ? 's' : ''}
              {result.failed > 0 && ` (${result.failed} failed)`}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Failed to send</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
