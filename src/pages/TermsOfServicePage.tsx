/**
 * TermsOfServicePage.tsx
 *
 * Terms of Service page for NorCal Moto Adventure
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <FileText className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
            <p className="text-slate-400">Effective Date: December 1, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-8">

            {/* Section 1: Acceptance */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                By accessing or using the NorCal Moto Adventure website (ncmotoadv.com) and the Baja Run 2026 mobile application
                (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree
                to these Terms, do not use the Service.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes
                acceptance of the modified Terms.
              </p>
            </section>

            {/* Section 2: Age Requirement */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Age Requirement</h2>
              <p className="text-slate-300 leading-relaxed">
                You must be at least <strong className="text-white">18 years of age</strong> to use this Service. By using the Service,
                you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.
              </p>
            </section>

            {/* Section 3: Account Registration */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Account Registration</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">3.1 Account Creation</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                To access certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your login credentials secure and confidential</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">3.2 Account Responsibility</h3>
              <p className="text-slate-300 leading-relaxed">
                You are solely responsible for all activities that occur under your account. We are not liable for any loss or
                damage arising from unauthorized use of your account.
              </p>
            </section>

            {/* Section 4: Tour Participation */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Tour Participation</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">4.1 Registration and Eligibility</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                Participation in NorCal Moto Adventure tours requires:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>A valid motorcycle license appropriate for the vehicle you will operate</li>
                <li>Proof of motorcycle insurance as required by applicable law</li>
                <li>A properly registered and insured motorcycle suitable for the tour</li>
                <li>Completion of all required registration forms and waivers</li>
                <li>Payment of applicable deposits and fees</li>
              </ul>

              {/* Risk Warning Box */}
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-300 font-semibold mb-2">4.2 Assumption of Risk</h4>
                    <p className="text-amber-200/80 leading-relaxed">
                      <strong>MOTORCYCLE TOURING IS INHERENTLY DANGEROUS.</strong> By registering for and participating in any tour,
                      you acknowledge and accept that:
                    </p>
                    <ul className="list-disc list-inside text-amber-200/80 space-y-1 mt-2 ml-2">
                      <li>Motorcycle riding involves significant risks including serious injury or death</li>
                      <li>Touring in remote areas, including international locations such as Baja California, Mexico, presents additional risks</li>
                      <li>You voluntarily assume all risks associated with tour participation</li>
                      <li>You are responsible for your own safety and the safe operation of your motorcycle</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">4.3 Required Documents</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                For international tours, you are solely responsible for obtaining and maintaining all required travel documents, including:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Valid passport</li>
                <li>Temporary Vehicle Import Permit (if required)</li>
                <li>Mexican motorcycle insurance</li>
                <li>FMM tourist card</li>
                <li>Any required visas</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                We are not responsible for your inability to participate due to missing or invalid documentation.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">4.4 Conduct During Tours</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                During tours, you agree to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Operate your motorcycle safely and in compliance with all applicable laws</li>
                <li>Follow the directions and guidance of tour organizers</li>
                <li>Respect other participants, local communities, and the environment</li>
                <li>Refrain from riding under the influence of alcohol or drugs</li>
                <li>Maintain your motorcycle in safe operating condition</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                We reserve the right to remove any participant from a tour for unsafe conduct, violation of these Terms,
                or any behavior that disrupts the tour or endangers others, without refund.
              </p>
            </section>

            {/* Section 5: Payments and Refunds */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Payments and Refunds</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">5.1 Deposits and Fees</h3>
              <p className="text-slate-300 leading-relaxed">
                Tour registration requires payment of deposits and fees as specified at the time of registration.
                All payments are processed securely through our payment providers.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">5.2 Refund Policy</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                Refund eligibility is determined by our cancellation policy in effect at the time of registration. Generally:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Deposits may be non-refundable or partially refundable depending on timing</li>
                <li>Cancellations made closer to the tour date may receive reduced or no refund</li>
                <li>No refunds will be provided for voluntary withdrawal during a tour</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">5.3 Tour Cancellation by Organizer</h3>
              <p className="text-slate-300 leading-relaxed">
                We reserve the right to cancel or modify tours due to weather, safety concerns, insufficient participation,
                or other circumstances beyond our control. In such cases, we will provide refunds or credits as appropriate.
              </p>
            </section>

            {/* Section 6: User-Generated Content */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. User-Generated Content</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">6.1 Your Content</h3>
              <p className="text-slate-300 leading-relaxed">
                You may upload, post, or share content through the Service, including photos, videos, comments, and forum posts
                ("User Content"). You retain ownership of your User Content, but by submitting it, you grant us a non-exclusive,
                royalty-free, worldwide license to use, display, reproduce, and distribute your User Content in connection with
                the Service, our marketing, and promotional materials.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">6.2 Content Visibility</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                You understand and agree that:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Photos and videos you upload may be visible to other tour participants</li>
                <li>Photos and videos may be featured on our website, social media, or promotional materials</li>
                <li>Forum posts and comments are visible to other registered users</li>
                <li>We may use photos from tours for marketing purposes unless you specifically opt out</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">6.3 Content Guidelines</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                You agree not to upload, post, or share content that:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable</li>
                <li>Infringes on any patent, trademark, copyright, or other proprietary rights</li>
                <li>Contains viruses, malware, or other harmful code</li>
                <li>Constitutes spam, advertising, or unauthorized solicitation</li>
                <li>Violates the privacy of others</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                We reserve the right to remove any User Content that violates these guidelines or these Terms, without notice.
              </p>
            </section>

            {/* Section 7: Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">7.1 Our Content</h3>
              <p className="text-slate-300 leading-relaxed">
                The Service and its original content (excluding User Content), features, and functionality are owned by
                NorCal Moto Adventure and are protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">7.2 Limited License</h3>
              <p className="text-slate-300 leading-relaxed">
                We grant you a limited, non-exclusive, non-transferable license to access and use the Service for personal,
                non-commercial purposes in accordance with these Terms.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">7.3 Restrictions</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                You may not:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Copy, modify, or distribute the Service or its content without permission</li>
                <li>Use the Service for any commercial purpose without our written consent</li>
                <li>Attempt to reverse engineer or extract source code from the Service</li>
                <li>Remove any copyright or proprietary notices from the Service</li>
              </ul>
            </section>

            {/* Section 8: Disclaimers */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Disclaimers</h2>

              <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-medium text-slate-200 mb-3">8.1 Service Provided "As Is"</h3>
                <p className="text-slate-300 leading-relaxed uppercase text-sm">
                  THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
                  INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
              </div>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">8.2 No Guarantee</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                We do not guarantee that:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>Results obtained from the Service will be accurate or reliable</li>
                <li>Any errors in the Service will be corrected</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">8.3 Third-Party Services</h3>
              <p className="text-slate-300 leading-relaxed">
                The Service may contain links to third-party websites or services. We are not responsible for the content,
                privacy policies, or practices of any third-party sites or services.
              </p>
            </section>

            {/* Section 9: Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>

              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-red-300 mb-3">9.1 General Limitation</h3>
                <p className="text-red-200/80 leading-relaxed uppercase text-sm">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, NORCAL MOTO ADVENTURE, ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS
                  SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
                  LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, ARISING FROM YOUR USE OF THE SERVICE.
                </p>
              </div>

              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-red-300 mb-3">9.2 Tour-Related Liability</h3>
                <p className="text-red-200/80 leading-relaxed uppercase text-sm">
                  YOU EXPRESSLY ACKNOWLEDGE THAT PARTICIPATION IN MOTORCYCLE TOURS INVOLVES INHERENT RISKS. TO THE MAXIMUM EXTENT
                  PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY PERSONAL INJURY, PROPERTY DAMAGE, OR DEATH ARISING FROM YOUR
                  PARTICIPATION IN ANY TOUR, REGARDLESS OF CAUSE.
                </p>
              </div>

              <h3 className="text-lg font-medium text-slate-200 mb-3">9.3 Maximum Liability</h3>
              <p className="text-slate-300 leading-relaxed">
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            {/* Section 10: Indemnification */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Indemnification</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                You agree to <strong className="text-white">indemnify, defend, and hold harmless</strong> NorCal Moto Adventure,
                its officers, directors, employees, and agents from any and all claims, liabilities, damages, losses, costs, or
                expenses (including reasonable attorneys' fees) arising from:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your participation in any tour</li>
                <li>Your User Content</li>
              </ul>
            </section>

            {/* Section 11: Termination */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Termination</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">11.1 By You</h3>
              <p className="text-slate-300 leading-relaxed">
                You may terminate your account at any time by contacting us or using account deletion features in the Service.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">11.2 By Us</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                We may suspend or terminate your account and access to the Service at any time, without notice, for conduct that we believe:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Violates these Terms</li>
                <li>Is harmful to other users, us, or third parties</li>
                <li>Is fraudulent or illegal</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">11.3 Effect of Termination</h3>
              <p className="text-slate-300 leading-relaxed">
                Upon termination, your right to use the Service will immediately cease. Provisions of these Terms that by their
                nature should survive termination shall survive, including ownership provisions, warranty disclaimers,
                indemnification, and limitations of liability.
              </p>
            </section>

            {/* Section 12: Dispute Resolution */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">12. Dispute Resolution</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">12.1 Informal Resolution</h3>
              <p className="text-slate-300 leading-relaxed">
                Before filing any legal claim, you agree to contact us and attempt to resolve the dispute informally for at least 30 days.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">12.2 Governing Law</h3>
              <p className="text-slate-300 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, United States,
                without regard to its conflict of law provisions.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">12.3 Jurisdiction</h3>
              <p className="text-slate-300 leading-relaxed">
                Any legal action or proceeding arising from these Terms shall be brought exclusively in the state or federal courts
                located in California, and you consent to the personal jurisdiction of such courts.
              </p>
            </section>

            {/* Section 13: General Provisions */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">13. General Provisions</h2>

              <h3 className="text-lg font-medium text-slate-200 mb-3">13.1 Entire Agreement</h3>
              <p className="text-slate-300 leading-relaxed">
                These Terms, together with our Privacy Policy and any tour-specific waivers, constitute the entire agreement
                between you and NorCal Moto Adventure regarding the Service.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">13.2 Severability</h3>
              <p className="text-slate-300 leading-relaxed">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">13.3 Waiver</h3>
              <p className="text-slate-300 leading-relaxed">
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3 mt-6">13.4 Assignment</h3>
              <p className="text-slate-300 leading-relaxed">
                You may not assign or transfer these Terms or your rights hereunder. We may assign our rights and obligations without restriction.
              </p>
            </section>

            {/* Section 14: Contact Us */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">14. Contact Us</h2>
              <p className="text-slate-300 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-white font-semibold">NorCal Moto Adventure</p>
                <p className="text-slate-300">Email: legal@ncmotoadv.com</p>
              </div>
            </section>

            {/* Last Updated */}
            <div className="pt-6 border-t border-slate-600">
              <p className="text-slate-500 text-sm italic">Last Updated: December 1, 2025</p>
            </div>

          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-8">
          <Link to="/privacy" className="text-slate-400 hover:text-blue-400 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/" className="text-slate-400 hover:text-blue-400 transition-colors">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
