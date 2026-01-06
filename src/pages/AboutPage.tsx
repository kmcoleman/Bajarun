/**
 * AboutPage.tsx
 *
 * About page for NorCal Moto Adventure
 * Company story, mission, and team information
 */

import { Link } from 'react-router-dom';
import {
  Bike,
  Users,
  MapPin,
  Target,
  Heart,
  Shield,
  Compass,
  ArrowRight,
  Quote,
  CheckCircle
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bike className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About NorCal Moto Adventure</h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            A community of riders organizing exceptional motorcycle adventures through California and Baja Mexico.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="aspect-[4/3] md:aspect-auto">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                  alt="Motorcycle adventure riding"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Our Mission</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Exceptional Adventures, Unforgettable Memories
                </h2>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  NorCal Moto Adventure was born from a simple idea: bring together riders who share a passion for
                  exploration and create opportunities for adventure that would be difficult to organize alone.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  We're not a commercial tour company charging premium prices. We're fellow riders who handle
                  the logistics so everyone can focus on what matters most - the ride, the roads, and the camaraderie.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="mb-20">
          <div className="max-w-3xl mx-auto text-center">
            <Quote className="h-10 w-10 text-blue-400 mx-auto mb-6" />
            <p className="text-xl md:text-2xl text-slate-200 leading-relaxed mb-6">
              "What started as a group of friends planning a Baja trip has grown into something more -
              a community of riders who believe the best adventures are shared adventures."
            </p>
            <p className="text-slate-400">
              Founded by members of the BMW Motorcycle Club of Northern California
            </p>
          </div>
        </section>

        {/* What We Believe */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What We Believe</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Compass className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">The Journey Matters</h3>
              <p className="text-slate-400">
                We plan routes for the roads, not the shortest path. Twisty mountain passes,
                coastal highways, and desert backroads are our specialty.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Ride Your Own Ride</h3>
              <p className="text-slate-400">
                No pace cars, no sweepers. Set your own pace, take the detours that call to you,
                and meet up with the group at the day's end.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Community First</h3>
              <p className="text-slate-400">
                We're riders organizing rides for riders. The connections made and stories shared
                around the dinner table are just as important as the miles covered.
              </p>
            </div>
          </div>
        </section>

        {/* What We Provide */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700 p-8 md:p-12">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">What We Handle</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-8">So You Can Focus on the Ride</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Route Planning</h4>
                    <p className="text-slate-400 text-sm">Carefully researched routes with GPS files, highlights, and fuel stops marked</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Accommodations</h4>
                    <p className="text-slate-400 text-sm">Hotels and campgrounds researched and booked in advance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Group Meals</h4>
                    <p className="text-slate-400 text-sm">Organized dinners at local restaurants - experience regional cuisine together</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Daily Briefings</h4>
                    <p className="text-slate-400 text-sm">Morning updates on weather, road conditions, and highlights ahead</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Mobile App</h4>
                    <p className="text-slate-400 text-sm">Real-time itinerary, notifications, and rider roster in your pocket</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Border Logistics</h4>
                    <p className="text-slate-400 text-sm">For Baja trips: guidance on permits, insurance, and crossing procedures</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Destinations */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Where We Ride</h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            From the Pacific Coast Highway to the deserts of Baja, we explore the best riding the West has to offer.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* California */}
            <div className="relative rounded-xl overflow-hidden aspect-[16/9] group">
              <img
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
                alt="California coast"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">California</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Northern California</h3>
                <p className="text-slate-300 text-sm">
                  Sierra Nevada passes, coastal routes, wine country, and redwood forests.
                </p>
              </div>
            </div>

            {/* Baja */}
            <div className="relative rounded-xl overflow-hidden aspect-[16/9] group">
              <img
                src="https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80"
                alt="Baja desert"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">Mexico</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Baja California</h3>
                <p className="text-slate-300 text-sm">
                  Desert landscapes, whale watching, missions, and the legendary Highway 1.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Join the Adventure?</h2>
            <p className="text-slate-300 max-w-2xl mx-auto mb-8">
              Browse our upcoming tours, sign up, and become part of the NorCal Moto Adventure community.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/tours"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
              >
                View Upcoming Tours
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-lg transition-all hover:-translate-y-0.5"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
