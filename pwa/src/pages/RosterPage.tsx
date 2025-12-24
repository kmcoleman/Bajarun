/**
 * Roster page - All riders with contact info.
 */

import { useState } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useOfflineData } from '../hooks/useOfflineData';

export function RosterPage() {
  const { user } = useAuth();
  const { roster, loading, syncing, refresh } = useOfflineData(user?.uid || null);
  const [search, setSearch] = useState('');

  // Filter roster by search
  const filteredRoster = roster.filter((rider) => {
    const searchLower = search.toLowerCase();
    const fullName = `${rider.odFirstName} ${rider.odLastName}`.toLowerCase();
    const nickname = rider.odNickname?.toLowerCase() || '';
    const bike = rider.odBike?.toLowerCase() || '';
    return fullName.includes(searchLower) || nickname.includes(searchLower) || bike.includes(searchLower);
  });

  // Sort alphabetically by last name
  const sortedRoster = [...filteredRoster].sort((a, b) =>
    a.odLastName.localeCompare(b.odLastName)
  );

  const handleRefresh = async () => {
    await refresh();
  };

  if (loading) {
    return (
      <Layout title="Roster" currentPath="/roster">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Roster" currentPath="/roster">
      {/* Search and refresh */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search riders..."
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleRefresh}
            disabled={syncing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {syncing ? '...' : '↻'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {sortedRoster.length} riders
        </div>
      </div>

      {/* Roster list */}
      {sortedRoster.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <span className="text-4xl mb-4 block">👥</span>
          <p>No riders found</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {sortedRoster.map((rider) => (
            <div
              key={rider.odId}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <div className="flex gap-4">
                {/* Photo */}
                {rider.odPhotoUrl ? (
                  <img
                    src={rider.odPhotoUrl}
                    alt={rider.odFirstName}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl flex-shrink-0">
                    {rider.odFirstName?.[0]}
                    {rider.odLastName?.[0]}
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {/* Name */}
                  <div className="font-semibold text-gray-900">
                    {rider.odFirstName} {rider.odLastName}
                  </div>
                  {rider.odNickname && (
                    <div className="text-sm text-gray-500">
                      "{rider.odNickname}"
                    </div>
                  )}

                  {/* Bike */}
                  {rider.odBike && (
                    <div className="text-sm text-gray-600 mt-1">
                      🏍️ {rider.odBike}
                    </div>
                  )}

                  {/* Contact buttons */}
                  <div className="flex gap-2 mt-3">
                    {rider.odPhone && (
                      <a
                        href={`tel:${rider.odPhone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
                      >
                        📞 Call
                      </a>
                    )}
                    {rider.odEmail && (
                      <a
                        href={`mailto:${rider.odEmail}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        ✉️ Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
