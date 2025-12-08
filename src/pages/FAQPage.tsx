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
  Tent,
  Info
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // About the Ride
  {
    id: 'about-1',
    category: 'About the Ride',
    question: 'What kind of tour is this?',
    answer: `**This is NOT a paid organized tour with rider support.** It's simply a group of fellow riders helping to organize a group tour with their fellow club members.

Remember: you get what you paid for, and since you're not paying the organizers, expect nothing in return! :) But they will do their best to organize a great tour of Baja to make it easier for you.`
  },
  {
    id: 'about-2',
    category: 'About the Ride',
    question: 'Is this a group ride?',
    answer: `**This is NOT a group ride.** All riders ride their own ride and can take the provided routes or chart their own routes. You will end up riding with small groups of riders, not a huge conga line.

If you don't have someone to ride with, we will help you find a group.`
  },
  {
    id: 'about-3',
    category: 'About the Ride',
    question: 'What should I expect?',
    answer: `You have to be easy going and go with the flow. There might be some issues - you might have to share a room with someone who snores. Don't complain, consider it part of the adventure!

**Prima donnas or those expecting a "tour" experience should consider alternatives.**

Everyone is a participant, not a customer - keep that in mind.`
  },
  {
    id: 'about-4',
    category: 'About the Ride',
    question: 'Should I expect other riders to help me?',
    answer: `While all riders will be gracious and likely help their fellow riders, **do not expect other riders to fix your problems.** Be self-sufficient and well prepared.

The organizers and riders will appreciate you more and be more likely to help you in the event there are problems.`
  },
  {
    id: 'about-5',
    category: 'About the Ride',
    question: 'How do meals and accommodations work?',
    answer: `Our preference is to have everyone handle their own. If the committed group is small (less than 10), we will roll that way with minimal planning.

If larger, it will likely require more planning and pre-reservations. In that case, the organizers will make reservations for participants that opt in to the group plan.

**If you opt in to the group plan:**
• Be easy going and flexible
• Organizers will do their best to offer a great experience with comfortable accommodations and good group meals
• Remember they are not professional tour guides, just fellow riders like you
• Group meals will be shared with a shared menu and fixed cost
• If you want exact costs allocated to you, consider opting out of the group plan

This approach makes it easier to organize and manage.`
  },
  {
    id: 'about-6',
    category: 'About the Ride',
    question: 'Is this ride right for me?',
    answer: `We have done this ride a few times now and thankfully it's always worked out - everyone was on the same page and had a great time.

If you don't understand this vibe or have questions, let us know and we are happy to give you a call and provide more details to help you decide if this is the ride for you.

**But please read the FAQs first!**`
  },
  // Documents & Requirements
  {
    id: '1',
    category: 'Documents & Requirements',
    question: 'What documents do I need to enter Mexico?',
    answer: `You'll need the following documents:
• Valid passport (must be valid for at least 6 months beyond your travel dates)
• Vehicle registration (a copy is fine)
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
  {
    id: '4',
    category: 'Documents & Requirements',
    question: 'Can I get more info about traveling in Baja?',
    answer: `Yes! Check out https://www.bajabound.com/ for great info about traveling in Baja as well as links to purchase motorcycle insurance.`
  },
  // Bike Preparation
  {
    id: '5',
    category: 'Bike Preparation',
    question: 'What type of motorcycle is suitable for this trip?',
    answer: `This trip is designed for BMW motorcycles. Most participants ride BMW GS models of all sizes.

While all riders can take their own routes, the provided route is all paved and suitable for all motorcycles. However, short portions of dirt and sand are unavoidable, especially when getting to camps and hotels.`
  },
  {
    id: '6',
    category: 'Bike Preparation',
    question: 'What maintenance should I do before the trip?',
    answer: `Ensure your bike is well maintained and in good working order. This includes:
• Fresh tires with good tread
• A properly adjusted chain
• A good battery - if it's getting old, get it replaced!
• Functioning lights and signals
• All leaks fixed
• Fresh oil and filter

We'll do a group bike check on Day 1 in El Cajon.`
  },
  // Costs & Logistics
  {
    id: '7',
    category: 'Costs & Logistics',
    question: 'What is the approximate cost of the trip?',
    answer: `Estimated costs (per person):
• Hotels (shared room): $50-100/night, average ~$85/night
• Camping: ~$15/night
• Food: ~$40/day
• Fuel: ~$250 (assuming 40 MPG, gas priced similar to California)
• Insurance and other fees: $250-500 depending on coverage

This doesn't include any excursions like whale watching or the cost to get to the border.`
  },
  {
    id: '8',
    category: 'Costs & Logistics',
    question: 'How will accommodations be handled?',
    answer: `How we handle reservations is TBD and depends on how many people commit. Last time we did the ride we organized the hotels and used the deposit to pay for them. This was necessary to secure sufficient rooms in advance and made it easy for everyone but was a lot of work.

If we do this again, all riders can choose to participate in the group plans which will be a combination of hotels and camping, but can always opt out and manage their own accommodations.

**Important:** Once you select an option it cannot be changed as we will be reserving accommodations using the deposit you submit with your registration.`
  },
  {
    id: '9',
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
    id: '10',
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
    id: '11',
    category: 'Safety & Medical',
    question: 'What medical preparations should I make?',
    answer: `Before the trip:
• Ensure your regular health insurance covers international travel (or purchase travel medical insurance)
• Bring any prescription medications (keep in original containers)
• Get Hepatitis A vaccine if you haven't already
• Pack a basic first aid kit
• Consider getting medical evacuation insurance such as https://medjetassist.com/

Each rider should have:
• Personal first aid supplies
• Emergency contact information
• Medical ID bracelet if applicable
• Copies of health insurance cards`
  },
  // Packing & Gear
  {
    id: '12',
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

**Camping Gear:**
• Tent, sleeping bag, pad (if camping)

The weather should be perfect but check before you leave.`
  },
  {
    id: '13',
    category: 'Packing & Gear',
    question: 'What navigation/communication tools are recommended?',
    answer: `**Navigation:**
• Download offline maps before crossing (Google Maps, Gaia GPS)
• GPX tracks will be provided for the route
• Physical map as backup

**Communication:**
• Cell service is spotty in Baja - have offline capabilities
• WhatsApp works best for group communication
• Consider a Garmin InReach or similar satellite communicator`
  }
];

// Group FAQ by category
const categories = [...new Set(faqData.map(item => item.category))];

const categoryIcons: Record<string, typeof HelpCircle> = {
  'About the Ride': Info,
  'Documents & Requirements': FileText,
  'Bike Preparation': Wrench,
  'Costs & Logistics': DollarSign,
  'Safety & Medical': Shield,
  'Packing & Gear': Tent
};

export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<string | null>('about-1');

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
            Everything you need to know about the Baja Tour 2026
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
