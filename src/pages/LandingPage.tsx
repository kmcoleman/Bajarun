/**
 * LandingPage.tsx
 *
 * Main landing page for ncmotoadv.com
 * Company-focused homepage showcasing NorCal Moto Adventure
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDown,
  ArrowRight,
  MapPin,
  Users,
  Shield,
  Compass,
  Calendar,
  Bike,
  Star,
  ChevronRight,
  Quote
} from 'lucide-react';

interface Tour {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: { seconds: number };
  endDate: { seconds: number };
  registrationType: 'open' | 'closed' | 'waitlist' | 'interest';
  maxParticipants: number;
  currentParticipants?: number;
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);

  // Fetch featured tours
  useEffect(() => {
    const toursRef = collection(db, 'tours');
    const q = query(toursRef, orderBy('startDate', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const toursData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Tour))
        .filter(t => t.registrationType !== 'closed')
        .slice(0, 3); // Show max 3 featured tours
      setTours(toursData);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen -mt-16">
      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        .gradient-text {
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #3b82f6 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 3s ease infinite;
        }

        .card-lift {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(59, 130, 246, 0.15);
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-transparent to-slate-900" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
            <Bike className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">California & Baja Adventure Tours</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-bold text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight mb-6">
            NorCal Moto
            <span className="block gradient-text">Adventure</span>
          </h1>

          {/* Subheadline */}
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            Premier motorcycle adventure touring in California and Baja Mexico.
            Expert-led group rides through the most spectacular roads and landscapes the West has to offer.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-16">
            <Link
              to="/tours"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 py-4 rounded-lg flex items-center shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30"
            >
              View Adventures
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/about"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white font-semibold text-base px-8 py-4 rounded-lg flex items-center transition-all hover:-translate-y-0.5"
            >
              About Us
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              <span>Experienced Guides</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Full Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span>Small Groups</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float">
          <ChevronDown className="h-8 w-8 text-white/50" />
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-24 bg-slate-800/50 border-y border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Ride With Us</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We're not a commercial tour company - we're riders organizing adventures for fellow enthusiasts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="card-lift bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Compass className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Expert Routes</h3>
              <p className="text-slate-400 text-sm">
                Carefully planned routes focusing on the best roads, not the fastest. Scenic twisties and hidden gems.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card-lift bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Logistics Handled</h3>
              <p className="text-slate-400 text-sm">
                Accommodations, group meals, and daily meetups organized. You just focus on the ride.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-lift bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">All Skill Levels</h3>
              <p className="text-slate-400 text-sm">
                Ride at your own pace and meet up at the day's end. No pressure, no sweepers breathing down your neck.
              </p>
            </div>

            {/* Card 4 */}
            <div className="card-lift bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
              <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Authentic Experiences</h3>
              <p className="text-slate-400 text-sm">
                Local culture, regional cuisine, and off-the-beaten-path destinations. Not your typical tourist route.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Adventures */}
      {tours.length > 0 && (
        <section className="py-24 bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Upcoming Adventures</h2>
                <p className="text-slate-400">Join us on our next motorcycle journey</p>
              </div>
              <Link
                to="/tours"
                className="inline-flex items-center text-blue-400 font-semibold px-4 py-2 rounded-lg border border-blue-400/30 hover:border-blue-400 hover:bg-blue-400/10 transition-all"
              >
                View All Tours
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <div
                  key={tour.id}
                  className="card-lift group relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-blue-500/50 cursor-pointer"
                  onClick={() => navigate('/tours')}
                >
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    {tour.imageUrl ? (
                      <img
                        src={tour.imageUrl}
                        alt={tour.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                        <Bike className="h-16 w-16 text-slate-500" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium text-white ${
                      tour.registrationType === 'open' ? 'bg-green-600' :
                      tour.registrationType === 'waitlist' ? 'bg-amber-600' :
                      'bg-purple-600'
                    }`}>
                      {tour.registrationType === 'open' ? 'Open' :
                       tour.registrationType === 'waitlist' ? 'Waitlist' : 'Coming Soon'}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                      {tour.name}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{tour.description}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(tour.startDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {tour.currentParticipants || 0}/{tour.maxParticipants}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quote / Philosophy */}
      <section className="py-20 bg-slate-800/30 border-y border-slate-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Quote className="h-12 w-12 text-blue-400 mx-auto mb-6" />
          <p className="text-2xl md:text-3xl font-medium text-slate-200 leading-relaxed mb-8">
            "It's not about the destination, it's about the roads we take to get there.
            And the friends we make along the way."
          </p>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bike className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-slate-400 text-sm">Our Riding Philosophy</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-blue-100 text-xl max-w-2xl mx-auto mb-10">
            Browse our upcoming tours, sign up, and join fellow riders for unforgettable journeys through California and Baja.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/tours"
              className="bg-white text-blue-600 hover:bg-slate-100 font-semibold text-lg px-10 py-4 rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Compass className="h-5 w-5" />
              Browse Adventures
            </Link>
            {!user && (
              <Link
                to="/login"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-10 py-4 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Sign Up / Login
                <ChevronRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo / Brand */}
            <div className="text-center md:text-left">
              <p className="text-white font-bold text-lg">NorCal Moto Adventure</p>
              <p className="text-slate-500 text-sm mt-1">California & Baja Motorcycle Tours</p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/about" className="text-slate-400 hover:text-blue-400 transition-colors">
                About
              </Link>
              <Link to="/tours" className="text-slate-400 hover:text-blue-400 transition-colors">
                Tours
              </Link>
              <Link to="/login" className="text-slate-400 hover:text-blue-400 transition-colors">
                Sign In
              </Link>
              <Link to="/privacy" className="text-slate-400 hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-slate-400 hover:text-blue-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} NorCal Moto Adventure. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
