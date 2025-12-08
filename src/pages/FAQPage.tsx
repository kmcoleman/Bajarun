/**
 * FAQPage.tsx
 *
 * Frequently Asked Questions about the Baja Tour.
 * Expandable accordion-style FAQ items.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  Shield,
  Wrench,
  DollarSign,
  Tent
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Documents & Requirements
  {
    id: '1',
    category: 'Documents & Requirements',
    question: 'What documents do I need to enter Mexico?',
    answer: `You'll need the following documents:
• Valid passport (must be valid for at least 6 months beyond your travel dates)
• Vehicle registration (original, not a copy)
• Valid driver's license
• Mexican vehicle permit (obtained at the border)
• Proof of Mexican motorcycle insurance (US insurance is not valid in Mexico)
• FMM tourist card (obtained at the border)

We'll provide a detailed checklist before the trip with specific instructions for obtaining these documents.`
  },
  {
    id: '2',
    category: 'Documents & Requirements',
    question: 'Where do I get Mexican motorcycle insurance?',
    answer: `We recommend purchasing Mexican motorcycle insurance before you arrive. Popular options include:
• Baja Bound (bajamotorcycleinsurance.com)
• MexPro (mexpro.com)
• Sanborn's Insurance

Coverage should include liability, collision, and medical. Expect to pay around $10-20 per day for comprehensive coverage. DO NOT ride without Mexican insurance - US insurance is not valid in Mexico.`
  },
  {
    id: '3',
    category: 'Documents & Requirements',
    question: 'Do I need a special license to ride in Mexico?',
    answer: `Your valid US motorcycle endorsement/license is recognized in Mexico. However, it must be current and valid. International Driving Permits (IDP) are not required but can be helpful as they provide a Spanish translation of your license. You can obtain an IDP from AAA for about $20.`
  },
  // Bike Preparation
  {
    id: '4',
    category: 'Bike Preparation',
    question: 'What type of motorcycle is suitable for this trip?',
    answer: `This trip is designed for adventure/dual-sport motorcycles. Most participants ride BMW GS models, but any reliable adventure bike works:
• BMW GS series (all sizes welcome)
• KTM Adventure
• Honda Africa Twin
• Yamaha Tenere
• Triumph Tiger

The roads are primarily paved (Highway 1) with some unpaved sections. A bike with at least 19" front wheel and capable of handling some loose gravel is ideal. Street-only bikes are not recommended.`
  },
  {
    id: '5',
    category: 'Bike Preparation',
    question: 'What maintenance should I do before the trip?',
    answer: `Before departure, ensure your bike has:
• Fresh oil and filter
• New or good-condition tires (at least 50% tread)
• Inspected brake pads and fluid
• Checked chain/final drive
• Tested battery
• Functional lights and signals
• Adjusted suspension for luggage weight

We'll do a group bike check on Day 1 in El Cajon. Bring basic tools and spare parts (tube/plug kit, clutch/brake levers, fuses).`
  },
  // Costs & Logistics
  {
    id: '6',
    category: 'Costs & Logistics',
    question: 'What is the approximate cost of the trip?',
    answer: `Estimated costs (per person):
• Hotels: $100-150/night × 8 nights = $800-1,200
• Fuel: ~$200-300 (gas is similar price to US)
• Food: $40-60/day × 9 days = $360-540
• Mexican insurance: $100-150 (for 9 days)
• Border crossing fees: ~$50
• Miscellaneous: $200-300

**Total estimate: $1,700 - $2,500**

This doesn't include airfare to/from San Diego or any optional excursions (whale watching, etc.). Costs can be reduced by sharing rooms.`
  },
  {
    id: '7',
    category: 'Costs & Logistics',
    question: 'How will accommodations be handled?',
    answer: `We have reserved blocks of rooms at each overnight location. Hotels are mid-range, clean, and motorcycle-friendly with secure parking. Room types include:
• Single occupancy (higher cost)
• Shared/double occupancy (split cost with another rider)

You'll book and pay for your own rooms directly. We'll provide contact info and reservation codes for each hotel. Please book early as March is prime season in Baja.`
  },
  {
    id: '8',
    category: 'Costs & Logistics',
    question: 'What about fuel availability?',
    answer: `Fuel (PEMEX stations) is readily available along Highway 1. The longest stretch without fuel is about 120 miles. Most bikes can handle this easily, but:
• Top off whenever you see a PEMEX station
• Bring a small fuel bladder if your bike has limited range
• Premium (Premium) is recommended for most adventure bikes
• Pay in pesos for better rates (ATMs are available in larger towns)`
  },
  // Safety & Medical
  {
    id: '9',
    category: 'Safety & Medical',
    question: 'Is it safe to ride in Mexico?',
    answer: `Baja California is one of the safest regions in Mexico for tourists. The Transpeninsular Highway (Highway 1) is well-traveled and we'll be in a group. Basic precautions:
• Ride during daylight hours only
• Stay with the group
• Don't display expensive items
• Keep copies of documents separate from originals
• Follow local advice on current conditions

We've led this trip multiple times without incident. The Mexican people are friendly and welcoming to motorcyclists.`
  },
  {
    id: '10',
    category: 'Safety & Medical',
    question: 'What medical preparations should I make?',
    answer: `Before the trip:
• Ensure your regular health insurance covers international travel (or purchase travel medical insurance)
• Bring any prescription medications (keep in original containers)
• Get Hepatitis A vaccine if you haven't already
• Pack a basic first aid kit

Each rider should have:
• Personal first aid supplies
• Emergency contact information
• Medical ID bracelet if applicable
• Copies of health insurance cards

We'll have a group first aid kit and satellite communicator for emergencies.`
  },
  // Packing & Gear
  {
    id: '11',
    category: 'Packing & Gear',
    question: 'What should I pack?',
    answer: `Essential packing list:
**Riding Gear:**
• Full riding suit (ventilated for warm weather)
• Helmet, gloves, boots
• Rain gear (March can have occasional showers)
• Hydration pack

**Clothing:**
• Casual clothes for evenings (4-5 days worth)
• Swimsuit (hotel pools, Sea of Cortez)
• Layers for Death Valley

**Documents:**
• Passport
• Driver's license
• Registration
• Insurance docs
• Credit cards & cash (pesos)

**Electronics:**
• Phone with offline maps downloaded
• Camera
• Charging cables
• Satellite communicator (optional but recommended)

Pack light! Hard cases or soft bags should total under 50 lbs.`
  },
  {
    id: '12',
    category: 'Packing & Gear',
    question: 'What navigation/communication tools are recommended?',
    answer: `**Navigation:**
• Download offline maps before crossing (Google Maps, Gaia GPS)
• GPX tracks will be provided for the route
• Physical map as backup

**Communication:**
• Cell service is spotty in Baja - have offline capabilities
• WhatsApp works best for group communication
• Consider a Garmin InReach or similar satellite communicator
• We'll use Sena/Cardo intercoms for group communication while riding

Mexico carriers: Telcel has best coverage. Consider a local SIM or international plan.`
  }
];

// Group FAQ by category
const categories = [...new Set(faqData.map(item => item.category))];

const categoryIcons: Record<string, typeof HelpCircle> = {
  'Documents & Requirements': FileText,
  'Bike Preparation': Wrench,
  'Costs & Logistics': DollarSign,
  'Safety & Medical': Shield,
  'Packing & Gear': Tent
};

export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const toggleQuestion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-slate-400">
            Everything you need to know about the Baja Tour 2025
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {categories.map((category) => {
            const Icon = categoryIcons[category] || HelpCircle;
            const categoryItems = faqData.filter(item => item.category === category);

            return (
              <div key={category}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">{category}</h2>
                </div>

                {/* Questions */}
                <div className="space-y-3">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(item.id)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
                      >
                        <span className="text-white font-medium pr-4">{item.question}</span>
                        {expandedId === item.id ? (
                          <ChevronUp className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>

                      {expandedId === item.id && (
                        <div className="px-6 pb-6 border-t border-slate-700">
                          <div className="pt-4 text-slate-300 whitespace-pre-line leading-relaxed">
                            {item.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 text-center bg-slate-800 rounded-xl border border-slate-700 p-8">
          <HelpCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">Still Have Questions?</h3>
          <p className="text-slate-400 mb-6">
            Can't find what you're looking for? Ask in the discussion forum or contact the organizer directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/discussion"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Ask in Discussion
            </a>
            <a
              href="mailto:kevin@example.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Email Organizer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
