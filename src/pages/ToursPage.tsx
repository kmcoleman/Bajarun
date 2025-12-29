/**
 * ToursPage.tsx
 *
 * Browse available tours and register for one.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Users,
  CreditCard,
  ChevronRight,
  CheckCircle,
  Loader2,
  MapPin,
  Bike,
  Bell
} from 'lucide-react';

// Registration types for events
type RegistrationType = 'open' | 'closed' | 'waitlist' | 'interest';

interface Tour {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: { seconds: number };
  endDate: { seconds: number };
  status: 'upcoming' | 'open' | 'closed' | 'completed';
  registrationType: RegistrationType;
  maxParticipants: number;
  currentParticipants?: number;
  depositAmount: number;
  notice?: string;
  sortOrder?: number;
}

export default function ToursPage() {
  const navigate = useNavigate();
  const { user, registration, registrationLoading, hasRegistration } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const toursRef = collection(db, 'tours');
    const q = query(toursRef, orderBy('startDate', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const toursData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tour[];
      // Sort by sortOrder if available, then by startDate
      toursData.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
      setTours(toursData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tours:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (tour: Tour) => {
    if (registration?.tourId === tour.id) {
      return { label: 'Registered', color: 'bg-green-600', textColor: 'text-green-400' };
    }
    // Use registrationType for badge
    switch (tour.registrationType) {
      case 'open':
        return { label: 'Open', color: 'bg-green-600', textColor: 'text-green-400' };
      case 'waitlist':
        return { label: 'Wait List', color: 'bg-amber-600', textColor: 'text-amber-400' };
      case 'interest':
        return { label: 'Coming Soon', color: 'bg-purple-600', textColor: 'text-purple-400' };
      case 'closed':
        return { label: 'Closed', color: 'bg-slate-600', textColor: 'text-slate-400' };
      default:
        return { label: tour.status || 'Unknown', color: 'bg-slate-600', textColor: 'text-slate-400' };
    }
  };

  const handleTourClick = (tour: Tour) => {
    if (registration?.tourId === tour.id) {
      // Already registered - go to home
      navigate('/');
      return;
    }

    // Navigate based on registration type
    switch (tour.registrationType) {
      case 'open':
        navigate('/register');
        break;
      case 'waitlist':
      case 'interest':
        navigate(`/waitlist?event=${tour.id}`);
        break;
      // 'closed' - no action
    }
  };

  if (loading || registrationLoading) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4" />
            <p className="text-slate-400">Loading tours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bike className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Available Tours</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Browse our upcoming motorcycle adventures and register to join the ride.
          </p>
        </div>

        {/* Welcome Card for non-registered users */}
        {user && !hasRegistration && (
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6 mb-8 flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Welcome!</h2>
              <p className="text-slate-300">
                You're signed in but haven't registered for a tour yet. Browse the available tours below and click "Register Now" to join the adventure.
              </p>
            </div>
          </div>
        )}

        {/* Tours List */}
        {tours.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <Calendar className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Tours Available</h2>
            <p className="text-slate-400">
              Check back soon for upcoming motorcycle adventures.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {tours.map((tour) => {
              const status = getStatusBadge(tour);
              const isRegistered = registration?.tourId === tour.id;

              return (
                <div
                  key={tour.id}
                  className={`bg-slate-800 rounded-xl border overflow-hidden transition-all ${
                    isRegistered
                      ? 'border-green-500/50 ring-1 ring-green-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="md:flex">
                    {/* Tour Image */}
                    <div className="md:w-1/3 relative">
                      {tour.imageUrl ? (
                        <img
                          src={tour.imageUrl}
                          alt={tour.name}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 md:h-full bg-slate-700 flex items-center justify-center">
                          <Bike className="h-16 w-16 text-slate-500" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium text-white ${status.color}`}>
                        {status.label}
                      </div>
                    </div>

                    {/* Tour Info */}
                    <div className="md:w-2/3 p-6">
                      <h2 className="text-2xl font-bold text-white mb-2">{tour.name}</h2>
                      <p className="text-slate-400 mb-4 line-clamp-2">{tour.description}</p>

                      {/* Notice Banner */}
                      {tour.notice && (
                        <div className="mb-4 p-3 bg-amber-600/10 border border-amber-500/30 rounded-lg">
                          <p className="text-amber-200 text-sm">{tour.notice}</p>
                        </div>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            {tour.currentParticipants || 0} / {tour.maxParticipants} riders
                          </span>
                        </div>
                        {tour.depositAmount > 0 && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">${tour.depositAmount} deposit</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {isRegistered ? (
                        <div className="flex items-center gap-3 px-4 py-3 bg-green-600/10 border border-green-500/30 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="text-green-400 font-medium">You're registered for this tour!</span>
                        </div>
                      ) : tour.registrationType === 'open' ? (
                        <button
                          onClick={() => handleTourClick(tour)}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 font-semibold rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Register Now
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : tour.registrationType === 'waitlist' ? (
                        <button
                          onClick={() => handleTourClick(tour)}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 font-semibold rounded-lg transition-colors bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Join Wait List
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : tour.registrationType === 'interest' ? (
                        <button
                          onClick={() => handleTourClick(tour)}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 font-semibold rounded-lg transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Bell className="h-4 w-4" />
                          Get Notified
                        </button>
                      ) : (
                        <div className="px-4 py-3 bg-slate-700/50 rounded-lg text-center">
                          <span className="text-slate-400">Registration Closed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Not signed in prompt */}
        {!user && (
          <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
            <p className="text-slate-300 mb-4">
              Sign in to register for a tour and join the adventure.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Sign In to Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
