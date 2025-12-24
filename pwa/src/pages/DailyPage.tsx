/**
 * Daily page - The main view showing all info for a selected day.
 */

import { useState } from 'preact/hooks';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useOfflineData } from '../hooks/useOfflineData';
import { itineraryData } from '../data/itinerary';

export function DailyPage() {
  const { user } = useAuth();
  const { userSelections, eventConfig, loading, syncing, refresh } = useOfflineData(
    user?.uid || null
  );
  const [selectedDay, setSelectedDay] = useState(1);

  const dayData = itineraryData.find((d) => d.day === selectedDay);
  const nightKey = `night-${selectedDay}`;
  const userNightSelection = userSelections?.nights?.[nightKey];
  const eventNightConfig = eventConfig?.[nightKey];

  const handleRefresh = async () => {
    await refresh();
  };

  if (!dayData) {
    return (
      <Layout title="Daily" currentPath="/">
        <div className="p-4 text-center text-gray-500">
          Day not found
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={dayData.endPoint} currentPath="/">
      {/* Day selector */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex overflow-x-auto hide-scrollbar px-2 py-2 gap-1">
          {itineraryData.map((day) => (
            <button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedDay === day.day
                  ? 'bg-baja-dark text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Day {day.day}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={syncing}
            className="flex-shrink-0 px-3 py-2 text-gray-400 hover:text-gray-600"
          >
            {syncing ? '...' : '↻'}
          </button>
        </div>
      </div>

      {/* Day header */}
      <div className="bg-baja-dark text-white p-4">
        <h2 className="text-xl font-bold">{dayData.title}</h2>
        <p className="text-blue-200 text-sm mt-1">{dayData.date}</p>
      </div>

      {/* Day content */}
      <div className="p-4 space-y-4">
        {/* Route Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-baja-dark text-white px-4 py-2 text-sm font-medium flex justify-between items-center">
            <span>Route</span>
            {dayData.miles > 0 && (
              <span className="text-blue-200">{dayData.miles} miles</span>
            )}
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Start</div>
                <div className="text-sm font-medium text-gray-900">
                  {dayData.startPoint}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">End</div>
                <div className="text-sm font-medium text-gray-900">
                  {dayData.endPoint}
                </div>
              </div>
            </div>
            {dayData.ridingTime !== 'N/A' && dayData.ridingTime !== 'Rest day' && (
              <div className="text-sm text-gray-600">
                Riding time: {dayData.ridingTime}
              </div>
            )}
            {dayData.miles > 0 && (
              <div className="flex gap-2 pt-2">
                <a
                  href={`https://www.google.com/maps/dir/${dayData.coordinates.start[0]},${dayData.coordinates.start[1]}/${dayData.coordinates.end[0]},${dayData.coordinates.end[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-center"
                >
                  Open in Maps
                </a>
                {eventNightConfig?.gpxFileUrl && (
                  <a
                    href={eventNightConfig.gpxFileUrl}
                    download
                    className="flex-1 bg-gray-100 text-gray-700 text-sm py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-center"
                  >
                    Download GPX
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Hotel Info Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-baja-sand text-white px-4 py-2 text-sm font-medium">
            Hotel Info
          </div>
          <div className="p-4 space-y-3">
            {/* Hotel name from config or fallback to itinerary */}
            <div className="text-gray-900 font-medium">
              {eventNightConfig?.hotelName || dayData.accommodation}
            </div>

            {/* Address - clickable to Google Maps */}
            {eventNightConfig?.hotelAddress && (
              <a
                href={eventNightConfig?.hotelMapsLink || `https://maps.google.com/?q=${encodeURIComponent(eventNightConfig.hotelAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-blue-600 hover:underline"
              >
                <span className="text-gray-400 mt-0.5">📍</span>
                <span>{eventNightConfig.hotelAddress}</span>
              </a>
            )}

            {/* Phone - clickable to call */}
            {eventNightConfig?.hotelPhone && (
              <a
                href={`tel:${eventNightConfig.hotelPhone}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <span className="text-gray-400">📞</span>
                <span>{eventNightConfig.hotelPhone}</span>
              </a>
            )}

            {/* Website link */}
            {eventNightConfig?.hotelWebsite && (
              <a
                href={eventNightConfig.hotelWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <span className="text-gray-400">🌐</span>
                <span>Website</span>
              </a>
            )}

            {/* Fallback links from itinerary */}
            {!eventNightConfig?.hotelWebsite && dayData.accommodationLinks && dayData.accommodationLinks.length > 0 && (
              <div className="space-y-2">
                {dayData.accommodationLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:underline"
                  >
                    {link.name} →
                  </a>
                ))}
              </div>
            )}

            {/* Open in Maps button */}
            {(eventNightConfig?.hotelMapsLink || eventNightConfig?.hotelAddress) && (
              <a
                href={eventNightConfig?.hotelMapsLink || `https://maps.google.com/?q=${encodeURIComponent(eventNightConfig?.hotelAddress || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-baja-sand text-white text-sm py-2 px-3 rounded-lg hover:opacity-90 transition-opacity block text-center mt-2"
              >
                Open in Maps
              </a>
            )}
          </div>
        </section>

        {/* My Selections Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-baja-orange text-white px-4 py-2 text-sm font-medium">
            My Selections
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-gray-500 text-sm">Loading...</div>
            ) : userNightSelection ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Accommodation:</span>
                  <span className="text-gray-900 text-sm font-medium capitalize">
                    {userNightSelection.accommodation || 'Not selected'}
                  </span>
                </div>
                {userNightSelection.assignedRoom && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Room:</span>
                    <span className="text-gray-900 text-sm font-medium">
                      {userNightSelection.assignedRoom}
                      {userNightSelection.assignedRoommate && ` (with ${userNightSelection.assignedRoommate})`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Dinner:</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {userNightSelection.dinner ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Breakfast:</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {userNightSelection.breakfast ? 'Yes' : 'No'}
                  </span>
                </div>
                {userNightSelection.prefersSingleRoom && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Room Type:</span>
                    <span className="text-gray-900 text-sm font-medium">Single Room</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 text-sm">
                No selections yet. Make your selections on the main website.
              </div>
            )}
          </div>
        </section>

        {/* Day Info Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-600 text-white px-4 py-2 text-sm font-medium">
            Day Info
          </div>
          <div className="p-4 space-y-3">
            <p className="text-gray-600 text-sm">{dayData.description}</p>
            {dayData.pointsOfInterest.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2 font-medium">
                  Points of Interest
                </div>
                <ul className="space-y-2">
                  {dayData.pointsOfInterest.map((poi, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-baja-orange">•</span>
                      <span>{poi}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
