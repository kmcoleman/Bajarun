/**
 * AdminLayout.tsx
 *
 * Shared layout for all admin pages with sidebar navigation.
 * Desktop: persistent sidebar, Mobile: hamburger menu
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  DollarSign,
  Hotel,
  Mail,
  Eye,
  Megaphone,
  Settings,
  ChevronDown,
  BedDouble,
  Receipt,
  FileText,
  Menu,
  Home,
  Wrench,
  Calendar,
  UserCog,
  ClipboardList,
  Upload,
  Send,
  X,
  Loader2,
  AlertCircle,
  Map
} from 'lucide-react';

const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  waitlistCount?: number;
}

export default function AdminLayout({ children, title, waitlistCount = 0 }: AdminLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const isAdmin = user?.uid === ADMIN_UID;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['registration', 'accommodations', 'communication', 'financial', 'tools'])
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  // Navigation items grouped by category
  const navGroups = [
    {
      id: 'registration',
      label: 'Registration',
      icon: Users,
      items: [
        { id: '/admin', label: 'All Registrations', icon: Users },
        { id: '/admin?tab=waitlist', label: `Waitlist${waitlistCount > 0 ? ` (${waitlistCount})` : ''}`, icon: ClipboardList },
        { id: '/admin?tab=profileViewer', label: 'Profile Viewer', icon: Eye },
        { id: '/admin/registration-cleanup', label: 'Registration Cleanup', icon: Wrench },
      ]
    },
    {
      id: 'accommodations',
      label: 'Accommodations',
      icon: BedDouble,
      items: [
        { id: '/admin/room-assignments', label: 'Room Assignments', icon: BedDouble },
        { id: '/admin/room-selections', label: 'Room Selections', icon: Hotel },
        { id: '/admin?tab=accommodations', label: 'Rider Preferences', icon: UserCog },
        { id: '/admin/rider-preferences', label: 'Edit Preferences', icon: Settings },
        { id: '/admin/nightly-config', label: 'Nightly Config', icon: Calendar },
        { id: '/admin/routes', label: 'Routes & Itinerary', icon: Map },
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: Mail,
      items: [
        { id: '/admin/tour-update-email', label: 'Tour Update Email', icon: Send },
        { id: '/admin/email-templates', label: 'Email Templates', icon: FileText },
        { id: '/admin?tab=email', label: 'Compose Email', icon: Mail },
        { id: '/admin?tab=announcements', label: 'Announcements', icon: Megaphone },
        { id: '/admin?tab=emailList', label: 'Email List', icon: ClipboardList },
      ]
    },
    {
      id: 'financial',
      label: 'Financial',
      icon: DollarSign,
      items: [
        { id: '/admin?tab=ledger', label: 'Ledger', icon: Receipt },
      ]
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: Wrench,
      items: [
        { id: '/admin?tab=roster', label: 'Roster', icon: FileText },
        { id: '/admin?tab=jsonUpload', label: 'JSON Upload', icon: Upload },
        { id: '/admin/data-integrity', label: 'Data Integrity', icon: AlertCircle },
      ]
    },
  ];

  // Check if current path matches nav item
  const isActive = (itemId: string) => {
    const [path, query] = itemId.split('?');
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (query) {
      return currentPath === path && currentSearch.includes(query);
    }
    return currentPath === path && !currentSearch;
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">This page is only accessible to administrators.</p>
        <Link to="/" className="mt-4 inline-block text-amber-600 hover:text-amber-700">
          Return Home
        </Link>
      </div>
    );
  }

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
        <p className="text-xs text-slate-400">Baja Tour 2026</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map(group => (
          <div key={group.id} className="mb-1">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <group.icon className="h-4 w-4 text-slate-400" />
                <span>{group.label}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expandedGroups.has(group.id) ? 'rotate-180' : ''}`} />
            </button>

            {/* Group Items */}
            {expandedGroups.has(group.id) && (
              <div className="ml-4 mt-1 space-y-0.5">
                {group.items.map(item => (
                  <Link
                    key={item.id}
                    to={item.id}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive(item.id)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Back to Site</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-in */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-800 border-r border-slate-700
        transform transition-transform duration-200 ease-in-out
        lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1 text-slate-400 hover:text-white z-10"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-white">{title}</h1>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block px-8 py-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
