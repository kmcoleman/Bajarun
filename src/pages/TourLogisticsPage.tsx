/**
 * TourLogisticsPage.tsx
 *
 * Page containing important tour logistics information including:
 * - FMM Card application guidance
 * - Mexico insurance requirements
 * - Border crossing tips
 * - And more to come...
 */

import { useState } from 'react';
import {
  FileText,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  User,
  MapPin,
  Mail,
  Plane,
  Shield,
  DollarSign,
  Clock
} from 'lucide-react';

interface FMMField {
  field: string;
  type: string;
  required: boolean;
  guidance?: string;
}

const fmmFields: { section: string; icon: React.ElementType; fields: FMMField[] }[] = [
  {
    section: 'Entry Information',
    icon: Plane,
    fields: [
      { field: 'Means of entry', type: 'Dropdown', required: true, guidance: 'Select "Land" for motorcycle entry' },
      { field: 'Point of entry', type: 'Dropdown', required: true, guidance: 'Select "Tecate" - this is where we cross' },
      { field: 'Date of arrival to Mexico', type: 'Date', required: true, guidance: 'March 20, 2026' },
      { field: 'Date of departure', type: 'Date', required: true, guidance: 'March 25, 2026 (when we cross back at Tecate)' },
      { field: 'Airline name', type: 'Text', required: false, guidance: 'Leave blank (land crossing)' },
      { field: 'Flight number', type: 'Text', required: false, guidance: 'Leave blank (land crossing)' },
    ]
  },
  {
    section: 'Personal Information',
    icon: User,
    fields: [
      { field: 'Name(s)', type: 'Text', required: true, guidance: 'Your first and middle names as shown on passport' },
      { field: 'Surname(s)', type: 'Text', required: true, guidance: 'Your last name as shown on passport' },
      { field: 'Gender', type: 'Dropdown', required: true },
      { field: 'Date of birth', type: 'Date', required: true },
      { field: 'Nationality (Country)', type: 'Dropdown', required: true },
      { field: 'Country of birth', type: 'Dropdown', required: true },
    ]
  },
  {
    section: 'Identification Document',
    icon: FileText,
    fields: [
      { field: 'Type of document', type: 'Dropdown', required: true, guidance: 'Select "Passport"' },
      { field: 'Document number', type: 'Text', required: true, guidance: 'Your passport number' },
      { field: 'Document number (Confirmation)', type: 'Text', required: true, guidance: 'Re-enter passport number' },
      { field: 'Country of issue', type: 'Dropdown', required: true },
      { field: 'Date of issue', type: 'Date', required: true, guidance: 'When your passport was issued' },
      { field: 'Date of issue (Confirmation)', type: 'Date', required: true },
      { field: 'Expiration date', type: 'Date', required: true, guidance: 'Must be valid for duration of trip' },
      { field: 'Expiration date (Confirmation)', type: 'Date', required: true },
    ]
  },
  {
    section: 'Place of Residence',
    icon: MapPin,
    fields: [
      { field: 'Country of residence', type: 'Dropdown', required: true },
      { field: 'Address of residence', type: 'Text', required: true, guidance: 'Your home address' },
    ]
  },
  {
    section: 'Trip Information',
    icon: Globe,
    fields: [
      { field: 'Reason of trip', type: 'Dropdown', required: true, guidance: 'Select "Tourism"' },
      { field: 'Specify', type: 'Dropdown', required: true, guidance: 'Select appropriate tourism option' },
      { field: 'State', type: 'Dropdown', required: true, guidance: 'Select "Baja California" (our first destination state)' },
      { field: 'Address in Mexico', type: 'Text', required: true, guidance: 'Enter: "Rancho Meling, San Quintin, Baja California"' },
    ]
  },
  {
    section: 'Contact Information',
    icon: Mail,
    fields: [
      { field: 'Email', type: 'Text', required: true, guidance: 'Your email address - confirmation will be sent here' },
      { field: 'Email (Confirmation)', type: 'Text', required: true },
      { field: 'Verification code', type: 'Text', required: true, guidance: 'Enter the CAPTCHA code shown' },
    ]
  },
];

export default function TourLogisticsPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['fmm']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Tour Logistics</h1>
          <p className="text-slate-400">
            Important information and requirements for the Baja Tour. Make sure to complete all requirements before the trip.
          </p>
        </div>

        {/* FMM Card Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          {/* Section Header */}
          <button
            onClick={() => toggleSection('fmm')}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Getting Your FMM Card</h2>
                <p className="text-sm text-slate-400">Forma Migratoria Múltiple - Required for entry to Mexico</p>
              </div>
            </div>
            {expandedSections.has('fmm') ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {/* Section Content */}
          {expandedSections.has('fmm') && (
            <div className="px-6 pb-6 space-y-6">
              {/* Important Notice */}
              <div className="flex items-start gap-3 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200 font-medium">Timing is Important!</p>
                  <p className="text-amber-200/80 text-sm mt-1">
                    The FMM form can be completed online <strong>no more than 30 days prior</strong> to your entrance to Mexico.
                    For our trip, you should complete this between <strong>February 18, 2026</strong> and <strong>March 20, 2026</strong>.
                  </p>
                </div>
              </div>

              {/* Payment Receipt Warning */}
              <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-200 font-medium">Save Your Payment Receipt!</p>
                  <p className="text-red-200/80 text-sm mt-1">
                    It is important to keep a copy of your payment confirmation. Border agents may ask for it, and if you don't have it you may need to pay again. This isn't always clear in the official guidance and is somewhat related to border agent scams. <strong>Be sure to take a photo of any payment confirmation when you finalize the FMM card to be safe.</strong>
                  </p>
                </div>
              </div>

              {/* Document Storage Note */}
              <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-200 font-medium">Store a Copy in Your Documents</p>
                  <p className="text-blue-200/80 text-sm mt-1">
                    You have a personal document storage folder to save copies of important documents. Click on your name and select <strong>My Documents</strong>, then upload a PDF of your FMM. Note: you still must bring a physical printout of the document to be stamped at the border.
                  </p>
                </div>
              </div>

              {/* Online Link */}
              <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium">Complete Your FMM Online</p>
                  <p className="text-sm text-slate-400">Official Mexican Immigration Website</p>
                </div>
                <a
                  href="https://www.inm.gob.mx/fmme/publico/en/solicitud.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Form
                </a>
              </div>

              {/* What You'll Need */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">What You'll Need</h3>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {[
                    'Valid passport',
                    'Passport issue & expiration dates',
                    'Your home address',
                    'Email address',
                    'Trip dates (arrival/departure)',
                    'Address in Mexico (provided below)'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form Fields Table */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Form Fields & Guidance</h3>

                {fmmFields.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.section} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="h-5 w-5 text-slate-400" />
                        <h4 className="text-white font-medium">{section.section}</h4>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left py-2 px-3 text-slate-400 font-medium">Field</th>
                              <th className="text-left py-2 px-3 text-slate-400 font-medium">Type</th>
                              <th className="text-center py-2 px-3 text-slate-400 font-medium">Required</th>
                              <th className="text-left py-2 px-3 text-slate-400 font-medium">Guidance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.fields.map((field, idx) => (
                              <tr
                                key={field.field}
                                className={idx % 2 === 0 ? 'bg-slate-900/30' : ''}
                              >
                                <td className="py-2 px-3 text-white">{field.field}</td>
                                <td className="py-2 px-3 text-slate-400">{field.type}</td>
                                <td className="py-2 px-3 text-center">
                                  {field.required ? (
                                    <span className="text-amber-400">Yes</span>
                                  ) : (
                                    <span className="text-slate-500">No</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-300">
                                  {field.guidance || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* After Submission */}
              <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                <h4 className="text-green-300 font-medium mb-2">After Submission</h4>
                <ul className="text-green-200/80 text-sm space-y-1">
                  <li>1. You will receive a confirmation email with your FMM document</li>
                  <li>2. Print the FMM document and bring it with you</li>
                  <li>3. Present the printed FMM at the border crossing</li>
                  <li>4. Keep the FMM with you during your entire stay in Mexico</li>
                  <li>5. You will need to surrender it when you exit Mexico</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Mexico Insurance Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          {/* Section Header */}
          <button
            onClick={() => toggleSection('insurance')}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Mexico Motorcycle Insurance</h2>
                <p className="text-sm text-slate-400">Required coverage for riding in Mexico</p>
              </div>
            </div>
            {expandedSections.has('insurance') ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {/* Section Content */}
          {expandedSections.has('insurance') && (
            <div className="px-6 pb-6 space-y-6">
              {/* Why You Need It */}
              <div className="flex items-start gap-3 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200 font-medium">Mexican Insurance is Required</p>
                  <p className="text-amber-200/80 text-sm mt-1">
                    US insurance policies are not valid in Mexico. You must have a Mexican insurance policy to legally ride in Mexico. If you're involved in an accident without proper coverage, you could face serious legal consequences.
                  </p>
                </div>
              </div>

              {/* Recommended Provider */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Recommended Provider: Baja Bound</h3>
                <p className="text-slate-300 text-sm mb-4">
                  We recommend Baja Bound for Mexico motorcycle insurance. The process is straightforward and self-explanatory. They specialize in Baja travel and offer excellent coverage options.
                </p>

                <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg">
                  <div className="flex-1">
                    <p className="text-white font-medium">Get Your Mexico Insurance</p>
                    <p className="text-sm text-slate-400">Baja Bound - Trusted Mexico Insurance Provider</p>
                  </div>
                  <a
                    href="https://www.bajabound.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Get Quote
                  </a>
                </div>
              </div>

              {/* Policy Dates */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Recommended Policy Dates</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-900 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Start Date & Time</p>
                      <p className="text-slate-300">Friday, March 20, 2026</p>
                      <p className="text-slate-400 text-sm">10:00 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-900 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">End Date</p>
                      <p className="text-slate-300">Friday, March 27, 2026</p>
                      <p className="text-slate-400 text-sm">Provides an extra day buffer</p>
                    </div>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-3">
                  The policy is time and date bound. We recommend ending coverage on March 27 to provide an extra day in case of problems or delays returning to the US.
                </p>
              </div>

              {/* Cost Example */}
              <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-200 font-medium">Example Cost</p>
                  <p className="text-blue-200/80 text-sm mt-1">
                    As a reference, a full coverage policy for a motorcycle valued at $13,000 was approximately <strong>$135</strong> for the trip duration. Your cost may vary based on your motorcycle's value and coverage options selected.
                  </p>
                </div>
              </div>

              {/* Document Storage Note */}
              <div className="flex items-start gap-3 p-4 bg-slate-900 rounded-lg">
                <FileText className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Save Your Policy</p>
                  <p className="text-slate-400 text-sm mt-1">
                    After purchasing, upload a copy of your Mexico insurance policy to <strong>My Documents</strong> for safekeeping. Also print a physical copy to carry with you during the trip.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Placeholder for future sections */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 text-center">
          <p className="text-slate-500">More logistics sections coming soon...</p>
          <p className="text-slate-600 text-sm mt-1">Border Crossing Tips, Packing List, etc.</p>
        </div>
      </div>
    </div>
  );
}
