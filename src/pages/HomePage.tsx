/**
 * HomePage.tsx
 *
 * Landing page for the Baja Tour website.
 * Dynamic, modern design with animations and interactive elements.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Route,
  Calendar,
  Bike,
  Users,
  ChevronDown,
  ArrowDown,
  ArrowRight,
  MapPin,
  Map,
  FileText,
  Check,
  Quote,
  Info,
  ExternalLink,
  Landmark,
  Waves,
  Camera,
  Palmtree,
  Smartphone,
  Bell,
  Image
} from 'lucide-react';
import { useRoutes, calculateTripSummary } from '../hooks/useRoutes';

export default function HomePage() {
  const [daysUntil, setDaysUntil] = useState(0);
  const [hoursUntil, setHoursUntil] = useState(0);
  const [minsUntil, setMinsUntil] = useState(0);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [countersAnimated, setCountersAnimated] = useState(false);
  const [milesCount, setMilesCount] = useState(0);
  const [daysCount, setDaysCount] = useState(0);
  const [ridingDaysCount, setRidingDaysCount] = useState(0);

  // Fetch routes from Firestore
  const { routes } = useRoutes();
  const tripSummary = calculateTripSummary(routes);
  const totalMiles = tripSummary.totalMiles;

  const statsRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const highlightsRef = useRef<HTMLElement>(null);
  const routeRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLElement>(null);
  const mobileAppRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const tripDate = new Date('2026-03-19T00:00:00');
      const now = new Date();
      const diff = tripDate.getTime() - now.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setDaysUntil(days);
      setHoursUntil(hours);
      setMinsUntil(mins);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyHeader(window.pageYOffset > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-triggered fade-in animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    }, observerOptions);

    const sections = [aboutRef, highlightsRef, routeRef, quoteRef, mobileAppRef, ctaRef];
    sections.forEach(ref => {
      if (ref.current) {
        fadeObserver.observe(ref.current);
      }
    });

    return () => fadeObserver.disconnect();
  }, []);

  // Animated counters - wait for routes to load
  useEffect(() => {
    // Don't animate until routes are loaded
    if (routes.length === 0) return;

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersAnimated) {
          setCountersAnimated(true);

          // Animate miles
          const milesTarget = totalMiles;
          const milesDuration = 2000;
          const milesStep = milesTarget / (milesDuration / 16);
          let milesCurrent = 0;
          const milesInterval = setInterval(() => {
            milesCurrent += milesStep;
            if (milesCurrent >= milesTarget) {
              setMilesCount(milesTarget);
              clearInterval(milesInterval);
            } else {
              setMilesCount(Math.floor(milesCurrent));
            }
          }, 16);

          // Animate days
          const daysTarget = tripSummary.totalDays;
          const daysStep = daysTarget / (2000 / 16);
          let daysCurrent = 0;
          const daysInterval = setInterval(() => {
            daysCurrent += daysStep;
            if (daysCurrent >= daysTarget) {
              setDaysCount(daysTarget);
              clearInterval(daysInterval);
            } else {
              setDaysCount(Math.floor(daysCurrent));
            }
          }, 16);

          // Animate riding days
          const ridingTarget = tripSummary.ridingDays;
          const ridingStep = ridingTarget / (2000 / 16);
          let ridingCurrent = 0;
          const ridingInterval = setInterval(() => {
            ridingCurrent += ridingStep;
            if (ridingCurrent >= ridingTarget) {
              setRidingDaysCount(ridingTarget);
              clearInterval(ridingInterval);
            } else {
              setRidingDaysCount(Math.floor(ridingCurrent));
            }
          }, 16);
        }
      });
    }, { threshold: 0.5 });

    if (statsRef.current) {
      counterObserver.observe(statsRef.current);
    }

    return () => counterObserver.disconnect();
  }, [countersAnimated, routes.length, totalMiles, tripSummary.totalDays, tripSummary.ridingDays]);

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

        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        .btn-shine::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        .btn-shine:hover::before {
          left: 100%;
        }

        .card-lift {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(59, 130, 246, 0.15);
        }
      `}</style>

      {/* Sticky Navigation Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 ${
          showStickyHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-xl text-white">BAJA 2026</span>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">About</a>
            <a href="#highlights" className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">Highlights</a>
            <a href="#route" className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">Route</a>
          </nav>
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section - Full Height */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/baja-hero.png"
            alt="BMW GS motorcycles riding through desert with saguaro cacti"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-10 flex flex-col items-center text-center">
          {/* Main Headline */}
          <h1 className="font-bold text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight mb-6">
            Baja California
            <span className="block gradient-text">Adventure 2026</span>
          </h1>

          {/* Subheadline */}
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            March 19th – March 27th, 2026 | Temecula to Death Valley via the spectacular Baja Peninsula
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-12">
            <a
              href="#about"
              className="btn-shine bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 py-3 rounded-lg flex items-center shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30"
            >
              Learn More
              <ArrowDown className="ml-2 h-5 w-5" />
            </a>
            <Link
              to="/register"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white font-semibold text-base px-8 py-3 rounded-lg flex items-center transition-all hover:-translate-y-0.5"
            >
              Register Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Countdown Timer */}
          <div className="w-full max-w-2xl border-t border-white/10 pt-10">
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-4">Departure Countdown</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              <div className="flex flex-col items-center">
                <span className="font-bold text-5xl md:text-6xl text-white tabular-nums">{daysUntil}</span>
                <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold mt-2">Days</span>
              </div>
              <div className="text-5xl md:text-6xl text-white/20 font-light hidden sm:block">:</div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-5xl md:text-6xl text-white tabular-nums">{hoursUntil.toString().padStart(2, '0')}</span>
                <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold mt-2">Hours</span>
              </div>
              <div className="text-5xl md:text-6xl text-white/20 font-light hidden sm:block">:</div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-5xl md:text-6xl text-white tabular-nums">{minsUntil.toString().padStart(2, '0')}</span>
                <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold mt-2">Mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float">
          <ChevronDown className="h-8 w-8 text-white/50" />
        </div>
      </section>

      {/* Stats Bar */}
      <section ref={statsRef} className="border-y border-slate-700 bg-slate-800 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-700">
            <div className="py-8 px-4 flex flex-col items-center text-center group hover:bg-slate-700/50 transition-colors">
              <Route className="h-8 w-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-3xl font-bold text-white tracking-tight">
                {milesCount.toLocaleString()}+
              </span>
              <span className="text-sm text-slate-400 font-medium uppercase mt-1">Total Miles</span>
            </div>
            <div className="py-8 px-4 flex flex-col items-center text-center group hover:bg-slate-700/50 transition-colors">
              <Calendar className="h-8 w-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-3xl font-bold text-white tracking-tight">{daysCount}</span>
              <span className="text-sm text-slate-400 font-medium uppercase mt-1">Days of Adventure</span>
            </div>
            <div className="py-8 px-4 flex flex-col items-center text-center group hover:bg-slate-700/50 transition-colors">
              <Bike className="h-8 w-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-3xl font-bold text-white tracking-tight">{ridingDaysCount}</span>
              <span className="text-sm text-slate-400 font-medium uppercase mt-1">Riding Days</span>
            </div>
            <div className="py-8 px-4 flex flex-col items-center text-center group hover:bg-slate-700/50 transition-colors">
              <Users className="h-8 w-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-3xl font-bold text-white tracking-tight">Limited</span>
              <span className="text-sm text-slate-400 font-medium uppercase mt-1">Group Size</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        ref={aboutRef}
        className="py-24 bg-slate-900 opacity-0 translate-y-8 transition-all duration-700"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Image */}
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-2xl shadow-blue-900/20">
                <img
                  alt="Friends riding together"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src="/friends.jpeg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/30 backdrop-blur-xl rounded-full z-10 hidden lg:block" />
              </div>
            </div>

            {/* Content */}
            <div className="w-full lg:w-1/2">
              <h2 className="font-semibold text-blue-400 uppercase text-sm tracking-widest mb-3">What Is This Trip?</h2>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Friends Riding Together<br/>Through Baja
              </h3>
              <div className="space-y-4 text-lg text-slate-300 mb-8 leading-relaxed">
                <p>
                  We're planning a group ride to Baja California in advance of the{' '}
                  <span className="text-white font-medium">BMW Motorcycle Club of Northern California's annual Death Valley Trip</span>.
                </p>
                <p>
                  This is <span className="text-blue-400 font-medium">not a club ride</span> but organized to help club members
                  who want to experience Baja on a motorcycle with some of the planning and logistics handled.
                </p>
                <p>
                  It's not a commercial group tour, just your fellow riders helping organize it for their friends.
                </p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Coordinated nightly stops at established locations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Mix of organized group meals and free time</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Ride at your own pace, meet up at day's end</span>
                </li>
              </ul>
              <Link
                to="/faq"
                className="btn-shine inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Read the FAQ
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Route Highlights */}
      <section
        id="highlights"
        ref={highlightsRef}
        className="py-24 bg-slate-800/50 border-y border-slate-700 opacity-0 translate-y-8 transition-all duration-700"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Route Highlights</h2>
              <p className="text-slate-400">Experience the best of Baja California</p>
            </div>
            <Link
              to="/itinerary"
              className="inline-flex items-center text-blue-400 font-semibold px-4 py-2 rounded-lg border border-blue-400/30 hover:border-blue-400 hover:bg-blue-400/10 transition-all"
            >
              View Full Itinerary
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 - Vizcaíno Desert */}
            <div className="card-lift group relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-blue-500/50">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  alt="Vizcaíno Desert"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="/vizciano.jpeg"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Vizcaíno Desert</h3>
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded uppercase">Day 2-3</span>
                </div>
                <p className="text-slate-400 text-sm mb-4">Cross through the stunning Vizcaíno Desert with its unique flora and dramatic landscapes.</p>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Landmark className="h-4 w-4" /> Desert
                  </span>
                  <span className="flex items-center gap-1">
                    <Route className="h-4 w-4" /> ~200mi
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2 - Gray Whale Migration */}
            <div className="card-lift group relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-blue-500/50">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  alt="Whale watching"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=600&q=80"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Gray Whale Migration</h3>
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded uppercase">Day 4</span>
                </div>
                <p className="text-slate-400 text-sm mb-4">Witness the incredible gray whale migration in the protected lagoons of Baja.</p>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Waves className="h-4 w-4" /> Wildlife
                  </span>
                  <span className="flex items-center gap-1">
                    <Camera className="h-4 w-4" /> Bucket List
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3 - Bahía Concepción */}
            <div className="card-lift group relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-blue-500/50">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  alt="Bahía Concepción"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="/bahiaConcep.jpeg"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Bahía Concepción</h3>
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded uppercase">Day 5-6</span>
                </div>
                <p className="text-slate-400 text-sm mb-4">Camp right on the beach and explore Mulegé, Loreto, and the historic mission at San Javier.</p>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Palmtree className="h-4 w-4" /> Beach
                  </span>
                  <span className="flex items-center gap-1">
                    <Landmark className="h-4 w-4" /> Missions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section
        id="route"
        ref={routeRef}
        className="relative py-24 bg-slate-900 overflow-hidden opacity-0 translate-y-8 transition-all duration-700"
      >
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1920&q=50')" }} />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white">The Route</h2>
              <p className="text-slate-400 text-lg max-w-lg">
                Start in Temecula, CA on March 19th, explore the Baja Peninsula, and arrive at Furnace Creek for Death Valley on March 27th.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/itinerary"
                  className="btn-shine bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <Map className="h-5 w-5" />
                  View Interactive Map
                </Link>
                <Link
                  to="/itinerary"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all hover:-translate-y-0.5"
                >
                  <FileText className="h-5 w-5" />
                  Full Itinerary
                </Link>
              </div>
            </div>
            <div className="relative w-full md:w-1/2 aspect-square max-w-md">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-900/20 rounded-2xl" />
              <div className="absolute inset-4 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <img
                  src="/map.jpeg"
                  alt="Baja map"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-blue-400 mx-auto animate-float" />
                    <p className="text-white font-semibold mt-2">Temecula to Furnace Creek</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / Quote */}
      <section
        ref={quoteRef}
        className="py-20 bg-slate-800/30 border-y border-slate-700 opacity-0 translate-y-8 transition-all duration-700"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Quote className="h-12 w-12 text-blue-400 mx-auto mb-6" />
          <p className="text-2xl md:text-3xl font-medium text-slate-200 leading-relaxed mb-8">
            "This is not a supported ride but one that enables riders to meet up at the end of each day in an established location. Some nights there will be organized meals, others you're on your own."
          </p>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-slate-400 text-sm">What to Expect</p>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section
        ref={mobileAppRef}
        className="py-24 bg-slate-900 opacity-0 translate-y-8 transition-all duration-700"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
              <Smartphone className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Available on iOS & Android</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Stay Connected on the Road
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Access tour information, connect with fellow riders, and stay updated with our mobile app.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Features */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="card-lift bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Map className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Real-Time Itinerary</h3>
                  <p className="text-slate-400 text-sm">Access the full route, daily plans, and interactive maps even offline.</p>
                </div>
              </div>

              <div className="card-lift bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Rider Roster</h3>
                  <p className="text-slate-400 text-sm">See who's joining the adventure and connect with fellow riders.</p>
                </div>
              </div>

              <div className="card-lift bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Push Notifications</h3>
                  <p className="text-slate-400 text-sm">Get important updates, route changes, and group announcements instantly.</p>
                </div>
              </div>

              <div className="card-lift bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Image className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Photo Gallery</h3>
                  <p className="text-slate-400 text-sm">Share and view photos from the trip with all participants.</p>
                </div>
              </div>

              {/* App Store Badges */}
              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="https://play.google.com/store/apps/details?id=com.ncmotoadv.bajarun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105"
                >
                  <img
                    src="/google-play-badge.png"
                    alt="Get it on Google Play"
                    className="h-12"
                  />
                </a>
                <a
                  href="#"
                  className="transition-transform hover:scale-105 opacity-50 cursor-not-allowed"
                  title="Coming Soon"
                >
                  <img
                    src="/app-store-badge.svg"
                    alt="Download on the App Store"
                    className="h-12"
                  />
                </a>
                <span className="text-slate-500 text-sm self-center">(iOS coming soon)</span>
              </div>
            </div>

            {/* Phone Screenshots */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative">
                {/* Background glow */}
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />

                {/* Phone mockups */}
                <div className="relative flex items-center justify-center gap-6">
                  {/* Left phone */}
                  <div className="relative w-48 md:w-56 z-10 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                    <div className="bg-slate-800 rounded-[2rem] p-2 shadow-2xl border border-slate-700">
                      <img
                        src="/Notices.jpg"
                        alt="Notices Screen"
                        className="rounded-[1.5rem] w-full"
                      />
                    </div>
                  </div>

                  {/* Right phone */}
                  <div className="relative w-48 md:w-56 z-10 transform rotate-6 hover:rotate-0 transition-transform duration-300">
                    <div className="bg-slate-800 rounded-[2rem] p-2 shadow-2xl border border-slate-700">
                      <img
                        src="/Registration.jpg"
                        alt="Registration Screen"
                        className="rounded-[1.5rem] w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        ref={ctaRef}
        className="relative py-24 bg-blue-600 overflow-hidden opacity-0 translate-y-8 transition-all duration-700"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Ready to Ride?
          </h2>
          <p className="text-blue-100 text-xl max-w-2xl mx-auto mb-10">
            If this sounds good, keep reading and sign up! Join fellow BMW enthusiasts for an unforgettable journey through Baja California.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-blue-600 hover:bg-slate-100 font-semibold text-lg px-10 py-4 rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              Register Now
            </Link>
            <Link
              to="/faq"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-10 py-4 rounded-xl transition-all hover:scale-105"
            >
              Read the FAQ
            </Link>
          </div>
          <p className="mt-8 text-sm text-blue-200">
            March 19th – 27th, 2026 | Temecula, CA to Furnace Creek
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo / Brand */}
            <div className="text-center md:text-left">
              <p className="text-white font-bold text-lg">NorCal Moto Adventure</p>
              <p className="text-slate-500 text-sm mt-1">Baja California Adventure 2026</p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/faq" className="text-slate-400 hover:text-blue-400 transition-colors">
                FAQ
              </Link>
              <Link to="/itinerary" className="text-slate-400 hover:text-blue-400 transition-colors">
                Itinerary
              </Link>
              <Link to="/register" className="text-slate-400 hover:text-blue-400 transition-colors">
                Register
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
