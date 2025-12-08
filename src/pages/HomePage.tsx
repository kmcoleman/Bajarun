/**
 * HomePage.tsx
 *
 * Landing page for the Baja Tour website.
 * Shows trip overview, countdown, and key highlights.
 */

import { Calendar, MapPin, Users, Bike, Mountain, Sun } from 'lucide-react';
import { tripSummary, totalMiles } from '../data/itinerary';
import { Link } from 'react-router-dom';

export default function HomePage() {
  // Calculate days until trip
  const tripDate = new Date('2026-03-19');
  const today = new Date();
  const daysUntil = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/baja-hero.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
            <Bike className="h-5 w-5 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">BMW Motorcycle Club</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Baja California
            <span className="block text-blue-400">Adventure 2025</span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Join us for an unforgettable 9-day motorcycle journey through Baja California,
            ending in the dramatic landscapes of Death Valley.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/itinerary"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <MapPin className="h-5 w-5" />
              View Itinerary
            </Link>
            <Link
              to="/participants"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Users className="h-5 w-5" />
              Meet the Riders
            </Link>
          </div>
        </div>
      </section>

      {/* Countdown & Stats */}
      <section className="py-12 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Countdown */}
            <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {daysUntil > 0 ? daysUntil : 'Now!'}
              </div>
              <div className="text-slate-400 text-sm">Days Until Departure</div>
            </div>

            {/* Total Miles */}
            <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
              <div className="text-4xl font-bold text-white mb-2">{totalMiles.toLocaleString()}</div>
              <div className="text-slate-400 text-sm">Total Miles</div>
            </div>

            {/* Days */}
            <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
              <div className="text-4xl font-bold text-white mb-2">{tripSummary.totalDays}</div>
              <div className="text-slate-400 text-sm">Days of Adventure</div>
            </div>

            {/* Riding Days */}
            <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
              <div className="text-4xl font-bold text-white mb-2">{tripSummary.ridingDays}</div>
              <div className="text-slate-400 text-sm">Riding Days</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trip Highlights */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Trip Highlights</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Highlight 1 */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Mountain className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Scenic Routes</h3>
              <p className="text-slate-400">
                Ride through the stunning Vizcaíno Desert, cross the Sierra de la Giganta,
                and experience the dramatic coastlines of both the Pacific and Sea of Cortez.
              </p>
            </div>

            {/* Highlight 2 */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Sun className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Cultural Experiences</h3>
              <p className="text-slate-400">
                Visit historic missions, explore charming Mexican towns, enjoy authentic cuisine,
                and witness the incredible gray whale migration in the lagoons.
              </p>
            </div>

            {/* Highlight 3 */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Brotherhood</h3>
              <p className="text-slate-400">
                Share the adventure with fellow BMW enthusiasts. Build lasting friendships
                over campfires, shared meals, and unforgettable riding experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Route Overview */}
      <section className="py-16 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Route Overview</h2>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Map placeholder */}
              <div className="bg-slate-900 h-64 md:h-auto flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Interactive map coming soon</p>
                  <Link to="/itinerary" className="text-blue-400 hover:underline text-sm mt-2 block">
                    View detailed itinerary →
                  </Link>
                </div>
              </div>

              {/* Route details */}
              <div className="p-6 lg:p-8">
                <h3 className="text-xl font-semibold text-white mb-6">The Journey</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">S</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Start: El Cajon, California</div>
                      <div className="text-slate-400 text-sm">March 19, 2025</div>
                    </div>
                  </div>

                  <div className="ml-4 border-l-2 border-dashed border-slate-600 h-8" />

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Baja California, Mexico</div>
                      <div className="text-slate-400 text-sm">Ensenada → San Quintín → Guerrero Negro → San Ignacio → Loreto</div>
                    </div>
                  </div>

                  <div className="ml-4 border-l-2 border-dashed border-slate-600 h-8" />

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">E</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">End: Furnace Creek, Death Valley</div>
                      <div className="text-slate-400 text-sm">March 27, 2025</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span>9 days • {totalMiles} miles • 2 countries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready for Adventure?</h2>
          <p className="text-slate-400 mb-8">
            Check out the full itinerary, connect with other riders, or browse the FAQ for trip details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/discussion"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Join the Discussion
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
