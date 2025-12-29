/**
 * RoomSelectionsPage.tsx
 *
 * Admin page showing nightly accommodation selections summary.
 * Displays counts and individual selections for each night.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Loader2,
  Hotel,
  Tent,
  UserX,
  User,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Coffee,
  Users,
  BedDouble,
  Download,
  AlertCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

// Night configuration
const NIGHTS = [
  { key: 'night-1', label: 'Night 1', location: 'Temecula', date: 'Mar 19' },
  { key: 'night-2', label: 'Night 2', location: 'Meling Ranch', date: 'Mar 20' },
  { key: 'night-3', label: 'Night 3', location: 'Guerrero Negro', date: 'Mar 21' },
  { key: 'night-4', label: 'Night 4', location: 'San Ignacio', date: 'Mar 22' },
  { key: 'night-5', label: 'Night 5', location: 'Mulegé', date: 'Mar 23' },
  { key: 'night-6', label: 'Night 6', location: 'BOLA', date: 'Mar 24' },
  { key: 'night-7', label: 'Night 7', location: 'Tecate', date: 'Mar 25' },
  { key: 'night-8', label: 'Night 8', location: 'Twentynine Palms', date: 'Mar 26' },
];

interface NightSelection {
  accommodation?: 'hotel' | 'camping' | 'own';
  prefersSingleRoom?: boolean;
  prefersFloorSleeping?: boolean;
  dinner?: boolean;
  breakfast?: boolean;
  optionalActivitiesInterested?: string[];
}

interface UserWithSelections {
  odUserId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  accommodationSelections: { [nightKey: string]: NightSelection };
  preferredRoommate?: string;
}

interface RegistrationInfo {
  uid: string;
  fullName: string;
  headshotUrl?: string;
}

export default function RoomSelectionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  const [selectedNight, setSelectedNight] = useState(0);
  const [users, setUsers] = useState<UserWithSelections[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users and registrations
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch all users
        const usersSnap = await getDocs(collection(db, 'users'));
        const userList: UserWithSelections[] = [];

        usersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.email || data.displayName || data.accommodationSelections) {
            userList.push({
              odUserId: doc.id,
              displayName: data.displayName || '',
              email: data.email || '',
              photoURL: data.photoURL,
              accommodationSelections: data.accommodationSelections || {},
              preferredRoommate: data.preferredRoommate
            });
          }
        });

        // Fetch registrations for names/photos
        const regsSnap = await getDocs(collection(db, 'registrations'));
        const regList: RegistrationInfo[] = [];

        regsSnap.forEach((doc) => {
          const data = doc.data();
          regList.push({
            uid: data.uid,
            fullName: data.fullName,
            headshotUrl: data.headshotUrl
          });
        });

        // Sort users by name
        userList.sort((a, b) => {
          const nameA = a.displayName || a.email || '';
          const nameB = b.displayName || b.email || '';
          return nameA.localeCompare(nameB);
        });

        setUsers(userList);
        setRegistrations(regList);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Get user's display name from users collection or registrations
  const getUserName = (userId: string, fallbackName: string) => {
    // Check users collection first (primary source)
    const userDoc = users.find(u => u.odUserId === userId);
    if (userDoc?.displayName) return userDoc.displayName;
    if (userDoc?.email) return userDoc.email;

    // Fallback to registrations
    const reg = registrations.find(r => r.uid === userId);
    if (reg?.fullName) return reg.fullName;

    // Fallback
    return fallbackName || 'Unknown';
  };

  // Get user's photo
  const getUserPhoto = (userId: string, fallbackPhoto?: string) => {
    const reg = registrations.find(r => r.uid === userId);
    return reg?.headshotUrl || fallbackPhoto;
  };

  // Calculate counts for current night
  const currentNightKey = NIGHTS[selectedNight].key;
  const getCounts = () => {
    let hotel = 0, camping = 0, own = 0, noSelection = 0, singleRoom = 0, dinner = 0, breakfast = 0;

    users.forEach(user => {
      const selection = user.accommodationSelections[currentNightKey];
      if (!selection?.accommodation) {
        noSelection++;
      } else if (selection.accommodation === 'hotel') {
        hotel++;
        if (selection.prefersSingleRoom) singleRoom++;
      } else if (selection.accommodation === 'camping') {
        camping++;
      } else if (selection.accommodation === 'own') {
        own++;
      }
      if (selection?.dinner) dinner++;
      if (selection?.breakfast) breakfast++;
    });

    return { hotel, camping, own, noSelection, singleRoom, dinner, breakfast, total: users.length };
  };

  const counts = getCounts();

  // Filter and sort users for display
  const getSortedUsers = () => {
    return [...users].sort((a, b) => {
      const aAccom = a.accommodationSelections[currentNightKey]?.accommodation || 'zzz';
      const bAccom = b.accommodationSelections[currentNightKey]?.accommodation || 'zzz';
      const order = { hotel: 1, camping: 2, own: 3, zzz: 4 };
      return (order[aAccom as keyof typeof order] || 4) - (order[bAccom as keyof typeof order] || 4);
    });
  };

  // Download CSV for current night
  const downloadCSV = () => {
    const night = NIGHTS[selectedNight];
    const sortedUsers = getSortedUsers();

    // CSV headers
    const headers = [
      'Name',
      'Email',
      'Accommodation',
      'Single Room',
      'Floor OK',
      'Dinner',
      'Breakfast',
      'Preferred Roommate'
    ];

    // CSV rows
    const rows = sortedUsers.map(user => {
      const selection = user.accommodationSelections[currentNightKey];
      const displayName = getUserName(user.odUserId, user.displayName || user.email);
      const accommodation = selection?.accommodation || 'Not Selected';
      const singleRoom = selection?.prefersSingleRoom ? 'Yes' : 'No';
      const floorOk = selection?.prefersFloorSleeping ? 'Yes' : 'No';
      const dinner = selection?.dinner ? 'Yes' : 'No';
      const breakfast = selection?.breakfast ? 'Yes' : 'No';
      const roommate = user.preferredRoommate || '';

      return [
        displayName,
        user.email,
        accommodation,
        singleRoom,
        floorOk,
        dinner,
        breakfast,
        roommate
      ];
    });

    // Add summary at top
    const summary = [
      [''],
      [`${night.label} - ${night.location} (${night.date})`],
      [''],
      ['Summary'],
      [`Hotel: ${counts.hotel}`],
      [`Camping: ${counts.camping}`],
      [`On Own: ${counts.own}`],
      [`Single Room: ${counts.singleRoom}`],
      [`Dinner: ${counts.dinner}`],
      [`Breakfast: ${counts.breakfast}`],
      [`No Selection: ${counts.noSelection}`],
      [`Total: ${counts.total}`],
      [''],
      headers
    ];

    // Combine summary and data
    const allRows = [...summary, ...rows];

    // Convert to CSV string
    const csvContent = allRows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `room-selections-${night.key}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout title="Room Selections">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Room Selections">
      <div className="max-w-6xl mx-auto">
        {/* Subtitle */}
        <p className="text-slate-400 mb-6">{users.length} users in system</p>

        {/* Night Tabs */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-2 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedNight(Math.max(0, selectedNight - 1))}
              disabled={selectedNight === 0}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>

            <div className="flex-1 flex gap-2 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
              {NIGHTS.map((night, index) => (
                <button
                  key={night.key}
                  onClick={() => setSelectedNight(index)}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedNight === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">{night.label}</div>
                    <div className="text-xs opacity-80 whitespace-nowrap">{night.location}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedNight(Math.min(NIGHTS.length - 1, selectedNight + 1))}
              disabled={selectedNight === NIGHTS.length - 1}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Current Night Info */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{NIGHTS[selectedNight].label}</h2>
              <p className="text-slate-400">{NIGHTS[selectedNight].location} • {NIGHTS[selectedNight].date}</p>
            </div>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          {/* Hotel */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Hotel className="h-5 w-5" />
              <span className="text-sm font-medium">Hotel</span>
            </div>
            <div className="text-3xl font-bold text-white">{counts.hotel}</div>
          </div>

          {/* Camping */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Tent className="h-5 w-5" />
              <span className="text-sm font-medium">Camping</span>
            </div>
            <div className="text-3xl font-bold text-white">{counts.camping}</div>
          </div>

          {/* On Your Own */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <UserX className="h-5 w-5" />
              <span className="text-sm font-medium">Own</span>
            </div>
            <div className="text-3xl font-bold text-white">{counts.own}</div>
          </div>

          {/* Single Room */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <BedDouble className="h-5 w-5" />
              <span className="text-sm font-medium">Single</span>
            </div>
            <div className="text-3xl font-bold text-white">{counts.singleRoom}</div>
          </div>

          {/* Dinner */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-sm font-medium">Dinner</span>
            </div>
            <div className="text-3xl font-bold text-white">{counts.dinner}</div>
          </div>

          {/* Breakfast */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Coffee className="h-5 w-5" />
              <span className="text-sm font-medium">Breakfast</span>
            </div>
            <div className="text-3xl font-bold text-white">{counts.breakfast}</div>
          </div>

          {/* No Selection */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">None</span>
            </div>
            <div className="text-3xl font-bold text-white">{counts.noSelection}</div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-5 w-5" />
              <span className="font-medium">Total Users</span>
            </div>
            <div className="text-2xl font-bold text-white">{counts.total}</div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Individual Selections</h3>
          </div>

          {/* Legend */}
          <div className="px-4 py-2 bg-slate-900/50 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-b border-slate-700">
            <span className="flex items-center gap-1">
              <Hotel className="h-3 w-3 text-blue-400" /> Hotel
            </span>
            <span className="flex items-center gap-1">
              <Tent className="h-3 w-3 text-green-400" /> Camping
            </span>
            <span className="flex items-center gap-1">
              <UserX className="h-3 w-3 text-slate-400" /> Own
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3 text-purple-400" /> Single Room
            </span>
            <span className="flex items-center gap-1">
              <UtensilsCrossed className="h-3 w-3 text-amber-400" /> Dinner
            </span>
            <span className="flex items-center gap-1">
              <Coffee className="h-3 w-3 text-orange-400" /> Breakfast
            </span>
          </div>

          {/* User List */}
          <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
            {getSortedUsers().map((userData) => {
              const selection = userData.accommodationSelections[currentNightKey];
              const accommodation = selection?.accommodation;

              const accomIcon = accommodation === 'hotel' ? (
                <Hotel className="h-4 w-4 text-blue-400" />
              ) : accommodation === 'camping' ? (
                <Tent className="h-4 w-4 text-green-400" />
              ) : accommodation === 'own' ? (
                <UserX className="h-4 w-4 text-slate-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              );

              const accomLabel = accommodation === 'hotel' ? 'Hotel' :
                accommodation === 'camping' ? 'Camping' :
                accommodation === 'own' ? 'On Own' : 'Not Selected';

              const accomBg = accommodation === 'hotel' ? 'bg-blue-600/20 text-blue-300' :
                accommodation === 'camping' ? 'bg-green-600/20 text-green-300' :
                accommodation === 'own' ? 'bg-slate-600/20 text-slate-300' : 'bg-red-600/20 text-red-300';

              const displayName = getUserName(userData.odUserId, userData.displayName || userData.email);
              const photoUrl = getUserPhoto(userData.odUserId, userData.photoURL);

              return (
                <div
                  key={userData.odUserId}
                  className="p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden flex-shrink-0">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-medium">{displayName}</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${accomBg}`}>
                          {accomIcon}
                          <span>{accomLabel}</span>
                        </span>
                      </div>
                      {userData.email && (
                        <p className="text-xs text-slate-400 mb-2">{userData.email}</p>
                      )}

                      {/* Selection Details */}
                      {selection && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {selection.prefersSingleRoom && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 rounded text-purple-300">
                              <BedDouble className="h-3 w-3" />
                              Single Room
                            </span>
                          )}
                          {selection.prefersFloorSleeping && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-cyan-600/20 rounded text-cyan-300">
                              Floor OK
                            </span>
                          )}
                          {selection.dinner && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-600/20 rounded text-amber-300">
                              <UtensilsCrossed className="h-3 w-3" />
                              Dinner
                            </span>
                          )}
                          {selection.breakfast && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-orange-600/20 rounded text-orange-300">
                              <Coffee className="h-3 w-3" />
                              Breakfast
                            </span>
                          )}
                          {/* Preferred Roommate - shown inline with other tags */}
                          {userData.preferredRoommate && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-pink-600/20 rounded text-pink-300">
                              <Users className="h-3 w-3" />
                              Roommate: {userData.preferredRoommate}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Preferred Roommate - shown if no selection */}
                      {!selection && userData.preferredRoommate && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1 px-2 py-1 bg-pink-600/20 rounded text-pink-300">
                            <Users className="h-3 w-3" />
                            Roommate: {userData.preferredRoommate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
