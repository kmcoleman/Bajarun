/**
 * UserGuidePage.tsx
 *
 * User guide explaining how to use the BMW Baja Tour website.
 */

import { Link } from 'react-router-dom';
import {
  BookOpen,
  UserPlus,
  BedDouble,
  FileText,
  Receipt,
  MessageSquare,
  Users,
  Bell,
  User,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Map,
  Clipboard,
  ChevronRight
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  steps?: string[];
  tips?: string[];
  link?: { to: string; label: string };
}

const guideSections: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <UserPlus className="h-6 w-6" />,
    description: 'Create an account and register for the tour to access all features.',
    steps: [
      'Click "Login" in the top right corner',
      'Sign in with Google or create an account with email/password',
      'Complete the registration form with your personal info, emergency contact, and motorcycle details',
      'Submit your deposit via Venmo or Zelle to secure your spot'
    ],
    tips: [
      'Use the same email address for signing in that you want tour communications sent to',
      'Upload a profile photo so other riders can recognize you'
    ],
    link: { to: '/register', label: 'Go to Registration' }
  },
  {
    id: 'my-profile',
    title: 'My Profile',
    icon: <User className="h-6 w-6" />,
    description: 'View and edit your registration information at any time.',
    steps: [
      'Click your profile photo in the top right corner',
      'Select "My Profile" from the dropdown menu',
      'View all your registration details organized by section',
      'Click "Edit" to make changes, then "Save" when done'
    ],
    tips: [
      'Keep your emergency contact information up to date',
      'Update your phone number if it changes before the trip'
    ],
    link: { to: '/my-profile', label: 'View My Profile' }
  },
  {
    id: 'tour-selections',
    title: 'My Ride (Tour Selections)',
    icon: <BedDouble className="h-6 w-6" />,
    description: 'Choose your accommodations, meals, and activities for each night of the tour.',
    steps: [
      'Navigate to "My Ride" from the profile dropdown',
      'For each of the 8 nights, select your accommodation preference (Hotel, Camping, or Own)',
      'Opt in or out of group dinners and breakfasts where available',
      'Add any dietary restrictions or roommate preferences',
      'Click "Save Selections" to record your choices'
    ],
    tips: [
      'Your estimated costs update in real-time as you make selections',
      'Single rooms are available at some locations for an additional cost',
      'You can change your selections anytime before the final deadline'
    ],
    link: { to: '/my-selections', label: 'Make Selections' }
  },
  {
    id: 'my-documents',
    title: 'My Documents',
    icon: <FileText className="h-6 w-6" />,
    description: 'Upload and store important travel documents for easy access during the trip.',
    steps: [
      'Go to "My Documents" from the profile dropdown',
      'Upload photos or scans of your documents',
      'Supported documents include: Passport, Driver\'s License, FMM Card, Mexico Insurance, US Insurance'
    ],
    tips: [
      'Take clear photos of your documents with good lighting',
      'Having digital copies accessible on your phone can be helpful at border crossings',
      'All documents are automatically deleted after the tour ends for your privacy'
    ],
    link: { to: '/my-documents', label: 'Upload Documents' }
  },
  {
    id: 'my-ledger',
    title: 'My Ledger',
    icon: <Receipt className="h-6 w-6" />,
    description: 'Track your estimated charges, payments, and account balance.',
    steps: [
      'Access "My Ledger" from the profile dropdown',
      'View your estimated charges based on your tour selections',
      'See posted charges once costs are finalized by the organizer',
      'Track payments you\'ve made and your current balance'
    ],
    tips: [
      'Estimated charges may vary slightly from final costs',
      'Contact the organizer if you have questions about specific charges',
      'Keep track of your balance to know when additional payments are needed'
    ],
    link: { to: '/my-ledger', label: 'View Ledger' }
  },
  {
    id: 'itinerary',
    title: 'Itinerary',
    icon: <Map className="h-6 w-6" />,
    description: 'Explore the day-by-day route with distances, stops, and points of interest.',
    steps: [
      'Click "Itinerary" in the main navigation',
      'Browse each day\'s route, mileage, and key stops',
      'View accommodation details and highlights for each location'
    ],
    tips: [
      'The itinerary includes estimated riding times and distances',
      'Check back periodically as details may be updated'
    ],
    link: { to: '/itinerary', label: 'View Itinerary' }
  },
  {
    id: 'participants',
    title: 'Participants',
    icon: <Users className="h-6 w-6" />,
    description: 'See who else is joining the tour and learn about your fellow riders.',
    steps: [
      'Click "Participants" in the main navigation (visible when logged in)',
      'Browse rider profiles with photos, nicknames, and motorcycles',
      'See riding experience levels and special skills'
    ],
    tips: [
      'Get to know your fellow riders before the trip',
      'Look for riders with complementary skills (mechanical, medical, etc.)'
    ],
    link: { to: '/participants', label: 'View Participants' }
  },
  {
    id: 'discussion',
    title: 'Discussion Forum',
    icon: <MessageSquare className="h-6 w-6" />,
    description: 'Connect with other riders, ask questions, and share ideas.',
    steps: [
      'Navigate to "Discussion" in the main menu (visible when logged in)',
      'Read existing posts from other riders',
      'Create new posts to start discussions or ask questions',
      'Reply to posts and like helpful content'
    ],
    tips: [
      'Use the forum to coordinate meetups or carpooling to the start',
      'Share tips, gear recommendations, or route suggestions',
      'Be respectful and constructive in your posts'
    ],
    link: { to: '/discussion', label: 'Join Discussion' }
  },
  {
    id: 'announcements',
    title: 'Announcements',
    icon: <Bell className="h-6 w-6" />,
    description: 'Stay updated with important messages from the tour organizer.',
    steps: [
      'Click the bell icon in the header to view announcements',
      'Unread announcements show a red badge with the count',
      'Click an announcement to mark it as read',
      'Use "Mark all read" to clear all notifications'
    ],
    tips: [
      'Check announcements regularly for important updates',
      'Urgent announcements are highlighted in red',
      'Important announcements are highlighted in amber'
    ]
  },
  {
    id: 'logistics',
    title: 'Tour Info',
    icon: <Clipboard className="h-6 w-6" />,
    description: 'Find essential information about Mexico entry requirements and insurance.',
    steps: [
      'Click "Info" in the main navigation (visible when logged in)',
      'Learn how to obtain your FMM tourist card online',
      'Review motorcycle insurance options for Mexico',
      'Read border crossing tips and requirements'
    ],
    tips: [
      'Apply for your FMM card before the trip to save time at the border',
      'Mexican motorcycle insurance is required - your US policy won\'t cover you',
      'Keep your FMM card safe - you\'ll need it to exit Mexico'
    ],
    link: { to: '/logistics', label: 'View Info' }
  }
];

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-slate-900 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">User Guide</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Everything you need to know about using the BMW Baja Tour website.
            Follow these guides to make the most of your tour experience.
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-400" />
            Quick Links
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {guideSections.filter(s => s.link).map((section) => (
              <Link
                key={section.id}
                to={section.link!.to}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm"
              >
                {section.icon}
                <span className="truncate">{section.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">In This Guide</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {guideSections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400">
                  {index + 1}
                </span>
                <span>{section.title}</span>
                <ChevronRight className="h-4 w-4 ml-auto text-slate-500" />
              </a>
            ))}
          </div>
        </div>

        {/* Guide Sections */}
        <div className="space-y-8">
          {guideSections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              {/* Section Header */}
              <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-400">
                    {section.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-slate-500">Step {index + 1}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                    <p className="text-slate-400 mt-1">{section.description}</p>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6 space-y-6">
                {/* Steps */}
                {section.steps && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                      How to Use
                    </h3>
                    <ol className="space-y-3">
                      {section.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {stepIndex + 1}
                          </span>
                          <span className="text-slate-300">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Tips */}
                {section.tips && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Tips
                    </h3>
                    <ul className="space-y-2">
                      {section.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2 text-slate-400 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Link */}
                {section.link && (
                  <Link
                    to={section.link.to}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {section.link.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* FAQ Link */}
        <div className="mt-12 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-700/50 p-8 text-center">
          <HelpCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Still Have Questions?</h2>
          <p className="text-slate-400 mb-6">
            Check out our FAQ for answers to common questions about the tour.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/faq"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
              View FAQ
            </Link>
            <Link
              to="/discussion"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              Ask in Discussion
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Last updated: December 2024</p>
        </div>
      </div>
    </div>
  );
}
