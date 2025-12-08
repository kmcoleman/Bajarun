/**
 * ParticipantsPage.tsx
 *
 * List of trip participants with their bikes and info.
 * Shows who's riding on the Baja Tour.
 * Requires authentication to view.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bike, MapPin, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Participant {
  id: string;
  fullName: string;
  city: string;
  state: string;
  bikeModel: string;
  bikeYear: string;
  speaksSpanish: boolean;
  specialSkills: string;
  headshotUrl: string | null;
  isOrganizer?: boolean;
  createdAt: Date;
}

export default function ParticipantsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

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
              <h3 className="text-lg font-semibold text-white">{person.fullName}</h3>
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
          </div>
        </div>

        {/* Special Skills */}
        {person.specialSkills && (
          <p className="text-slate-400 text-sm mt-4 italic">"{person.specialSkills}"</p>
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
        </div>
      </div>
    </div>
  );
}
