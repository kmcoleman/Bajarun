/**
 * Layout.tsx
 *
 * Main layout component with header navigation and mobile menu.
 * Includes authentication status and responsive design.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Map,
  MessageSquare,
  Users,
  HelpCircle,
  Menu,
  X,
  LogIn,
  LogOut,
  Bike,
  ClipboardList
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/itinerary', label: 'Itinerary', icon: Map },
  { path: '/discussion', label: 'Discussion', icon: MessageSquare },
  { path: '/participants', label: 'Participants', icon: Users },
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
  { path: '/register', label: 'Register', icon: ClipboardList },
];

export default function Layout({ children }: LayoutProps) {
  const { user, signInWithGoogle, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bike className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-bold text-lg">BMW Baja Tour</div>
                <div className="text-slate-400 text-xs">March 2025</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Auth & Mobile Menu Button */}
            <div className="flex items-center gap-3">
              {/* Auth Button */}
              {!loading && (
                <div className="hidden sm:block">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={user.photoURL || '/default-avatar.png'}
                        alt={user.displayName || 'User'}
                        className="w-8 h-8 rounded-full border-2 border-blue-500"
                      />
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={signInWithGoogle}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </button>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Auth */}
              <div className="pt-3 border-t border-slate-700 mt-3">
                {user ? (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.photoURL || '/default-avatar.png'}
                        alt={user.displayName || 'User'}
                        className="w-8 h-8 rounded-full border-2 border-blue-500"
                      />
                      <span className="text-white">{user.displayName}</span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      signInWithGoogle();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-blue-600 text-white rounded-lg"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Sign In with Google</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Bike className="h-5 w-5" />
              <span>BMW Motorcycle Club - Baja Tour 2026</span>
            </div>
            <div className="text-slate-500 text-sm">
              March 19-27, 2026 • El Cajon to Death Valley
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
