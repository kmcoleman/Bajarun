/**
 * SupportPage.tsx
 *
 * Support page for iOS App Store requirements.
 * Provides contact info, FAQ, and help resources.
 */

import { Link } from 'react-router-dom';
import {
  Mail,
  MessageCircle,
  HelpCircle,
  FileText,
  Shield,
  Bike,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I register for a tour?',
    answer: 'After signing in with your Google or Apple account, navigate to the Tours page to browse available adventures. Select a tour and tap "Register Now" to complete your registration form with your rider information, emergency contacts, and preferences.'
  },
  {
    question: 'How do I receive notifications?',
    answer: 'When you first open the app, you\'ll be prompted to allow notifications. Make sure to enable them to receive important updates from your tour captain about route changes, meet-up times, and group coordination.'
  },
  {
    question: 'How do I upload my required documents?',
    answer: 'Go to your Profile tab and select "My Documents." You can upload photos of your passport, motorcycle registration, insurance, and other required documents directly from your phone.'
  },
  {
    question: 'How do I change my accommodation selections?',
    answer: 'Navigate to "My Ride" from your profile menu. There you can view the nightly options and select your preferred accommodation (camping or hotel) for each night of the tour.'
  },
  {
    question: 'How do I view the tour itinerary?',
    answer: 'The Itinerary tab shows the complete day-by-day schedule including routes, distances, accommodations, and points of interest. Tap any day to see detailed information.'
  },
  {
    question: 'How do I contact other riders?',
    answer: 'The Roster tab shows all registered participants. You can view rider profiles to learn about your fellow adventurers before and during the tour.'
  },
  {
    question: 'How do I share photos from the tour?',
    answer: 'Use the Gallery tab to upload photos and videos from your adventure. All participants can view and enjoy shared memories from the ride.'
  },
  {
    question: 'What if I need to cancel my registration?',
    answer: 'Please contact us directly at the email below to discuss cancellation. Refund policies vary based on timing and committed reservations.'
  },
  {
    question: 'Is my personal information secure?',
    answer: 'Yes. We use Firebase Authentication and Firestore with strict security rules. Your personal data is only accessible to you and tour administrators. See our Privacy Policy for details.'
  }
];

export default function SupportPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bike className="h-10 w-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">NorCal Moto Adventure</h1>
          <p className="text-xl text-slate-400">App Support</p>
        </div>

        {/* Contact Section */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-400" />
            Contact Us
          </h2>
          <p className="text-slate-300 mb-4">
            Have questions, feedback, or need assistance? We're here to help!
          </p>
          <div className="space-y-3">
            <a
              href="mailto:support@futurepathdevelopment.com"
              className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                  support@futurepathdevelopment.com
                </p>
                <p className="text-slate-400 text-sm">Email support</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 ml-auto" />
            </a>
          </div>
          <p className="text-slate-400 text-sm mt-4">
            We typically respond within 24-48 hours.
          </p>
        </section>

        {/* FAQ Section */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-400" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFAQ === index && (
                  <div className="px-4 pb-4">
                    <p className="text-slate-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* App Info */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            About the App
          </h2>
          <p className="text-slate-300 mb-4">
            NorCal Moto Adventure is the official companion app for motorcycle adventure tours
            organized by NorCal Moto ADV and Kevin Coleman. The app helps riders register for tours,
            access itineraries, receive real-time notifications, connect with fellow riders, and more.
          </p>
          <p className="text-slate-300 mb-4">
            Kevin is an avid motorcyclist and long-time member of the BMW Club of Northern California.
            He has served as Treasurer, President, and Tour Captain, and has ridden extensively throughout
            the Western US, Mexico, Canada, and Alaska. He enjoys organizing group rides and tours, and
            created NorCal Moto ADV to provide ADV touring opportunities to fellow riders.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-slate-400">Version</p>
              <p className="text-white font-medium">1.0.0</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-slate-400">Platform</p>
              <p className="text-white font-medium">iOS & Android</p>
            </div>
          </div>
        </section>

        {/* Legal Links */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Legal
          </h2>
          <div className="space-y-2">
            <Link
              to="/privacy"
              className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors group"
            >
              <Shield className="h-5 w-5 text-slate-400" />
              <span className="text-white group-hover:text-blue-400 transition-colors">
                Privacy Policy
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500 ml-auto -rotate-90" />
            </Link>
            <Link
              to="/terms"
              className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors group"
            >
              <FileText className="h-5 w-5 text-slate-400" />
              <span className="text-white group-hover:text-blue-400 transition-colors">
                Terms of Service
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500 ml-auto -rotate-90" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} NorCal Moto Adventure. All rights reserved.</p>
          <p className="mt-2">
            Made with passion for the riding community.
          </p>
        </div>
      </div>
    </div>
  );
}
