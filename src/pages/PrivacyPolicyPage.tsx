/**
 * PrivacyPolicyPage.tsx
 *
 * Privacy Policy page for NorCal Moto Adventure
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center text-slate-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="text-slate-400">Effective Date: December 1, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-8">

            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Introduction</h2>
              <p className="text-slate-300 leading-relaxed">
                NorCal Moto Adventure ("we," "us," or "our") operates the ncmotoadv.com website and the Baja Run 2026
                mobile application (collectively, the "Service"). This Privacy Policy explains how we collect, use,
                and protect your personal information when you use our Service.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                By using our Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Age Requirement */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Age Requirement</h2>
              <p className="text-slate-300 leading-relaxed">
                Our Service is intended solely for users who are <strong className="text-white">18 years of age or older</strong>.
                We do not knowingly collect personal information from anyone under the age of 18. If you are under 18,
                please do not use our Service or provide any personal information to us.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Information We Collect</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">Information You Provide</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                When you register for an account or participate in our tours, we may collect:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-slate-200">Personal Information:</strong> Name, nickname, email address, phone number</li>
                <li><strong className="text-slate-200">Emergency Contact Information:</strong> Name and phone number of your designated emergency contact</li>
                <li><strong className="text-slate-200">Motorcycle Information:</strong> Bike make, model, and year</li>
                <li><strong className="text-slate-200">Experience Information:</strong> Riding experience, skills, and preferences</li>
                <li><strong className="text-slate-200">Profile Photo:</strong> Headshot image you upload</li>
                <li><strong className="text-slate-200">Payment Information:</strong> Transaction records related to tour deposits and payments</li>
                <li><strong className="text-slate-200">Rider Documents:</strong> Copies of driver's license, passport, and insurance documents you choose to upload</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">Information Generated Through Use</h3>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-slate-200">Photos and Videos:</strong> Media you upload to share with other tour participants</li>
                <li><strong className="text-slate-200">Forum Posts and Comments:</strong> Content you post in discussion areas</li>
                <li><strong className="text-slate-200">Tour Selections:</strong> Your accommodation and meal preferences for tours</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                We use your information solely to provide and improve our Service, including:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Creating and managing your account</li>
                <li>Organizing and coordinating motorcycle tours</li>
                <li>Communicating tour updates, alerts, and announcements</li>
                <li>Facilitating contact between tour participants and organizers</li>
                <li>Processing tour registrations and payments</li>
                <li>Sending push notifications about tour-related information</li>
                <li>Responding to your inquiries and support requests</li>
              </ul>
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 font-medium">We do not track your browsing behavior across other websites.</p>
                <p className="text-blue-300 font-medium mt-2">We do not sell, rent, or trade your personal information to third parties.</p>
              </div>
            </section>

            {/* Information Sharing and Visibility */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Information Sharing and Visibility</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">With Other Users</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                Certain information you provide may be visible to other registered users of the Service:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-slate-200">Roster Information:</strong> Your name, nickname, profile photo, bike information, and contact details may be visible to other participants on the same tour</li>
                <li><strong className="text-slate-200">Photos and Videos:</strong> Media you upload to the gallery will be visible to other tour participants and may be made publicly visible on our website or social media</li>
                <li><strong className="text-slate-200">Forum Posts:</strong> Comments and posts you make in discussion areas will be visible to other users</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">With Service Providers</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                We use the following third-party services to operate our Service:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-slate-200">Firebase (Google):</strong> Database, user authentication, file storage, and hosting</li>
                <li><strong className="text-slate-200">Google Sign-In:</strong> Optional authentication method</li>
                <li><strong className="text-slate-200">Apple Sign-In:</strong> Optional authentication method</li>
                <li><strong className="text-slate-200">Expo Push Notifications:</strong> Delivery of mobile app notifications</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                These service providers may have access to your personal information only to perform tasks on our behalf
                and are obligated not to disclose or use it for other purposes.
              </p>
            </section>

            {/* Data Storage and Security */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Data Storage and Security</h2>
              <p className="text-slate-300 leading-relaxed">
                Your information is stored on secure servers provided by Google Cloud Platform (Firebase) located in the United States.
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect
                your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Cookies and Similar Technologies</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                We use cookies and similar technologies for:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-slate-200">Authentication:</strong> To keep you signed in to your account</li>
                <li><strong className="text-slate-200">Preferences:</strong> To remember your settings and preferences</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                We do not use cookies for advertising or cross-site tracking purposes.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Data Retention</h2>
              <p className="text-slate-300 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide you with our Service.
                If you request deletion of your account, we will delete or anonymize your personal information within 30 days, except
                where we are required to retain certain information for legal or legitimate business purposes.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Your Rights</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">Access and Portability</h3>
              <p className="text-slate-300 leading-relaxed">
                You have the right to request a copy of the personal information we hold about you.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-4">Correction</h3>
              <p className="text-slate-300 leading-relaxed">
                You can update most of your personal information directly through your account profile. For other corrections, please contact us.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-4">Deletion</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                You may request deletion of your account and personal information by contacting us at the email address below. Please note that:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Content you have shared publicly (photos, forum posts) may remain visible even after account deletion</li>
                <li>We may retain certain information as required by law or for legitimate business purposes</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-4">California Residents (CCPA)</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                If you are a California resident, you have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Know what personal information we collect, use, and disclose</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of the sale of your personal information (note: we do not sell your information)</li>
                <li>Not be discriminated against for exercising your privacy rights</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                To exercise these rights, please contact us using the information below.
              </p>
            </section>

            {/* Push Notifications */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Push Notifications</h2>
              <p className="text-slate-300 leading-relaxed">
                If you enable push notifications on our mobile app, we will send you tour-related alerts and updates.
                You can disable push notifications at any time through your device settings.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Changes to This Privacy Policy</h2>
              <p className="text-slate-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Effective Date" at the top. We encourage you to review this
                Privacy Policy periodically.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                For material changes, we will provide notice through the Service or via email.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-slate-300 leading-relaxed">
                If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-white font-semibold">NorCal Moto Adventure</p>
                <p className="text-slate-300">Email: privacy@ncmotoadv.com</p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Governing Law</h2>
              <p className="text-slate-300 leading-relaxed">
                This Privacy Policy and any disputes arising from it shall be governed by the laws of the State of California,
                United States, without regard to its conflict of law provisions.
              </p>
            </section>

            {/* Last Updated */}
            <div className="pt-6 border-t border-slate-600">
              <p className="text-slate-500 text-sm italic">Last Updated: December 1, 2025</p>
            </div>

          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-8">
          <Link to="/terms" className="text-slate-400 hover:text-blue-400 transition-colors">
            Terms of Service
          </Link>
          <Link to="/" className="text-slate-400 hover:text-blue-400 transition-colors">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
