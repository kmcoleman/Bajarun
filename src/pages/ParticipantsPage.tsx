/**
 * ParticipantsPage.tsx
 *
 * List of trip participants with their bikes and info.
 * Shows who's riding on the Baja Tour.
 * Requires authentication to view.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bike, MapPin, LogIn, Loader2, Phone, Mail, MessageCircle, Map as MapIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Participant {
  id: string;
  fullName: string;
  nickname: string | null;
  tagline: string | null;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  bikeModel: string;
  bikeYear: string;
  speaksSpanish: boolean;
  specialSkills: string;
  skillMechanical: boolean;
  skillMedical: boolean;
  skillPhotography: boolean;
  skillOther: boolean;
  skillOtherText: string;
  headshotUrl: string | null;
  isOrganizer?: boolean;
  createdAt: Date;
  // Stored coordinates (geocoded from zip code)
  latitude?: number;
  longitude?: number;
}

// Format phone number to (xxx) xxx-xxxx
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone; // Return original if can't format
}

// Get digits only for tel: links
function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export default function ParticipantsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Subscribe to registrations collection
    const q = query(
      collection(db, 'registrations'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Participant[];
        setParticipants(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching participants:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Filter participants that have stored coordinates
  const participantsWithCoords = useMemo(() =>
    participants.filter(p => p.latitude && p.longitude),
    [participants]
  );

  // Fixed map center (Oakland/Berkeley area)
  const mapCenter = { lat: 37.878942, lng: -122.180497 };

  // Still checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Not logged in - show sign in prompt
  if (!user) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Sign In Required</h1>
            <p className="text-slate-400 mb-6">
              Please sign in to view the list of participants for the Baja Tour 2026.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Create Account / Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const organizers = participants.filter(p => p.isOrganizer);
  const riders = participants.filter(p => !p.isOrganizer);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Participants</h1>
          <p className="text-slate-400">
            Meet your fellow riders for the Baja Tour 2026
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-2">
            <User className="h-4 w-4 text-blue-400" />
            <span className="text-blue-300">{participants.length} riders registered</span>
          </div>
        </div>

        {/* Map Section */}
        {!loading && participants.length > 0 && (
          <div className="mb-12">
            {/* Map Toggle */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <MapIcon className="h-4 w-4 text-green-400" />
                </span>
                Rider Locations
              </h2>
              <button
                onClick={() => setShowMap(!showMap)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>

            {showMap && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {participantsWithCoords.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-slate-400">No locations available. Run geocoding from Admin Dashboard.</p>
                  </div>
                ) : (
                  <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={8}
                    className="w-[500px] h-[500px] mx-auto"
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {participantsWithCoords.map((participant) => (
                      <Marker key={participant.id} position={[participant.latitude!, participant.longitude!]}>
                        <Popup>
                          <div className="text-center min-w-[150px]">
                            {participant.headshotUrl && (
                              <img
                                src={participant.headshotUrl}
                                alt={participant.fullName}
                                className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
                              />
                            )}
                            <p className="font-semibold text-slate-900">
                              {participant.nickname || participant.fullName}
                            </p>
                            <p className="text-sm text-slate-600">
                              {participant.city}, {participant.state}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {participant.bikeYear} {participant.bikeModel}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
                <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-700">
                  <p className="text-xs text-slate-500 text-center">
                    {participantsWithCoords.length} of {participants.length} riders shown on map
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && participants.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Registrations Yet</h3>
            <p className="text-slate-400 mb-6">
              Be the first to register for the Baja Tour 2026!
            </p>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Register Now
            </button>
          </div>
        )}

        {/* Participants List */}
        {!loading && participants.length > 0 && (
          <>
            {/* Organizers */}
            {organizers.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </span>
                  Trip Organizers
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {organizers.map((person) => (
                    <ParticipantCard key={person.id} person={person} featured />
                  ))}
                </div>
              </div>
            )}

            {/* Riders */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Bike className="h-4 w-4 text-slate-300" />
                </span>
                Riders ({riders.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {riders.map((person) => (
                  <ParticipantCard key={person.id} person={person} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ParticipantCardProps {
  person: Participant;
  featured?: boolean;
}

function ParticipantCard({ person, featured }: ParticipantCardProps) {
  return (
    <div className={`bg-slate-800 rounded-xl border overflow-hidden ${
      featured ? 'border-blue-500/50' : 'border-slate-700'
    }`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
            featured ? 'bg-blue-600' : 'bg-slate-700'
          }`}>
            {person.headshotUrl ? (
              <img
                src={person.headshotUrl}
                alt={person.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className={`h-7 w-7 ${featured ? 'text-white' : 'text-slate-400'}`} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-white">
                {person.nickname || person.fullName}
              </h3>
              {person.isOrganizer && (
                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                  Organizer
                </span>
              )}
              {person.speaksSpanish && (
                <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">
                  Spanish
                </span>
              )}
            </div>
            {/* Show full name if nickname is displayed */}
            {person.nickname && (
              <p className="text-slate-400 text-sm">{person.fullName}</p>
            )}
          </div>
        </div>

        {/* Tagline - always show for consistent height */}
        <p className="text-slate-400 text-sm mt-4 italic min-h-[20px]">
          {person.tagline ? `"${person.tagline}"` : '\u00A0'}
        </p>

        {/* Specialized Skills */}
        {(person.skillMechanical || person.skillMedical || person.skillPhotography || person.skillOther) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {person.skillMechanical && (
              <span className="px-2 py-0.5 bg-orange-600/20 text-orange-400 text-xs rounded-full">
                Mechanical
              </span>
            )}
            {person.skillMedical && (
              <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full">
                Medical
              </span>
            )}
            {person.skillPhotography && (
              <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                Photography
              </span>
            )}
            {person.skillOther && person.skillOtherText && (
              <span className="px-2 py-0.5 bg-cyan-600/20 text-cyan-400 text-xs rounded-full">
                {person.skillOtherText}
              </span>
            )}
          </div>
        )}

        {/* Details */}
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Bike className="h-4 w-4 text-blue-400" />
            <span className="text-white">{person.bikeYear} {person.bikeModel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">{person.city}, {person.state}</span>
          </div>

          {/* Phone */}
          {person.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-green-500" />
              <div className="flex items-center gap-3">
                <a
                  href={`tel:${getPhoneDigits(person.phone)}`}
                  className="text-slate-300 hover:text-white transition-colors"
                  title="Call"
                >
                  {formatPhoneNumber(person.phone)}
                </a>
                <a
                  href={`sms:${getPhoneDigits(person.phone)}`}
                  className="text-green-400 hover:text-green-300 transition-colors"
                  title="Send text message"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {/* Email */}
          {person.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-blue-400" />
              <a
                href={`mailto:${person.email}`}
                className="text-slate-300 hover:text-white transition-colors truncate"
                title="Send email"
              >
                {person.email}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
