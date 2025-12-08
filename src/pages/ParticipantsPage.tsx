/**
 * ParticipantsPage.tsx
 *
 * List of trip participants with their bikes and info.
 * Shows who's riding on the Baja Tour.
 */

import { User, Bike, MapPin, Mail } from 'lucide-react';

// Sample participant data (will come from Firestore later)
const participants = [
  {
    id: '1',
    name: 'Kevin Coleman',
    role: 'Trip Organizer',
    location: 'San Francisco, CA',
    bike: 'BMW R1250GS Adventure',
    bikeYear: 2023,
    avatar: null,
    isOrganizer: true,
    bio: 'Organizing BMW rides for 10 years. This will be my 5th Baja trip!'
  },
  {
    id: '2',
    name: 'Mike Richardson',
    role: 'Rider',
    location: 'San Diego, CA',
    bike: 'BMW R1250GS',
    bikeYear: 2022,
    avatar: null,
    isOrganizer: false,
    bio: 'Adventure rider and photographer. Looking forward to capturing the journey.'
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    role: 'Rider',
    location: 'Los Angeles, CA',
    bike: 'BMW F850GS',
    bikeYear: 2024,
    avatar: null,
    isOrganizer: false,
    bio: 'First Baja trip! Excited to explore Mexico on two wheels.'
  },
  {
    id: '4',
    name: 'Tom Bradley',
    role: 'Sweep Rider',
    location: 'Phoenix, AZ',
    bike: 'BMW R1300GS',
    bikeYear: 2024,
    avatar: null,
    isOrganizer: false,
    bio: 'Certified mechanic and experienced desert rider. Happy to help with any roadside issues.'
  },
  {
    id: '5',
    name: 'David Chen',
    role: 'Rider',
    location: 'Oakland, CA',
    bike: 'BMW R1250GS Adventure',
    bikeYear: 2021,
    avatar: null,
    isOrganizer: false,
    bio: 'Weekend warrior turning adventure tourist. Bringing the camping gear!'
  },
  {
    id: '6',
    name: 'Lisa Martinez',
    role: 'Rider',
    location: 'Tucson, AZ',
    bike: 'BMW F900GS',
    bikeYear: 2024,
    avatar: null,
    isOrganizer: false,
    bio: 'Dual-sport enthusiast. Have ridden Baja twice before - happy to share tips!'
  }
];

export default function ParticipantsPage() {
  const organizers = participants.filter(p => p.isOrganizer);
  const riders = participants.filter(p => !p.isOrganizer);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Participants</h1>
          <p className="text-slate-400">
            Meet your fellow riders for the Baja Tour 2025
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-2">
            <User className="h-4 w-4 text-blue-400" />
            <span className="text-blue-300">{participants.length} riders confirmed</span>
          </div>
        </div>

        {/* Organizers */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </span>
            Trip Organizers
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {organizers.map((person) => (
              <ParticipantCard key={person.id} person={person} featured />
            ))}
          </div>
        </div>

        {/* Riders */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
              <Bike className="h-4 w-4 text-slate-300" />
            </span>
            Riders ({riders.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riders.map((person) => (
              <ParticipantCard key={person.id} person={person} />
            ))}
          </div>
        </div>

        {/* Join CTA */}
        <div className="mt-16 text-center bg-slate-800 rounded-xl border border-slate-700 p-8">
          <h3 className="text-2xl font-bold text-white mb-3">Want to Join?</h3>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Interested in joining the Baja Tour 2025? Contact the organizer for availability and registration details.
          </p>
          <a
            href="mailto:kevin@example.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Mail className="h-5 w-5" />
            Contact Organizer
          </a>
        </div>
      </div>
    </div>
  );
}

interface ParticipantCardProps {
  person: typeof participants[0];
  featured?: boolean;
}

function ParticipantCard({ person, featured }: ParticipantCardProps) {
  return (
    <div className={`bg-slate-800 rounded-xl border overflow-hidden ${
      featured ? 'border-blue-500/50' : 'border-slate-700'
    }`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
            featured ? 'bg-blue-600' : 'bg-slate-700'
          }`}>
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={person.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className={`h-7 w-7 ${featured ? 'text-white' : 'text-slate-400'}`} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-white">{person.name}</h3>
              {person.isOrganizer && (
                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                  Organizer
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">{person.role}</p>
          </div>
        </div>

        {/* Bio */}
        {person.bio && (
          <p className="text-slate-400 text-sm mt-4 italic">"{person.bio}"</p>
        )}

        {/* Details */}
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Bike className="h-4 w-4 text-blue-400" />
            <span className="text-white">{person.bikeYear} {person.bike}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">{person.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
