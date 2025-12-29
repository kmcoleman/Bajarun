/**
 * RoomAssignmentsPage.tsx
 *
 * Admin page for assigning riders to hotel rooms.
 * Two-panel layout: unassigned riders on left, room grid on right.
 * Supports Days 1, 2, 6, 7, and 8 with different accommodations.
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  BedDouble,
  Users,
  Tent,
  Loader2,
  Check,
  X,
  Heart,
  UserPlus,
  Save,
  User,
  FileDown,
  Home
} from 'lucide-react';
import jsPDF from 'jspdf';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import type { RoomInventory, BedAssignment, RoomAssignmentsDoc, RoomAssignmentDay } from '../types/rooms';
import { ROOM_ASSIGNMENT_DAYS, DAY_INFO, createRoomBedKey, parseRoomBedKey } from '../types/rooms';

const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface Registration {
  id: string;
  uid: string;
  fullName: string;
  nickname?: string;
  accommodationPreference?: string;
}

interface NightSelection {
  accommodation?: 'hotel' | 'camping' | 'own';
  prefersSingleRoom?: boolean;
}

interface UserData {
  displayName?: string;
  preferredRoommate?: string;
  accommodationSelections?: { [nightKey: string]: NightSelection };
}

export default function RoomAssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  // State
  const [selectedDay, setSelectedDay] = useState<RoomAssignmentDay>(1);
  const [rooms, setRooms] = useState<RoomInventory[]>([]);
  const [assignments, setAssignments] = useState<RoomAssignmentsDoc>({});
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [userPreferences, setUserPreferences] = useState<{ [uid: string]: UserData }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRiders, setSelectedRiders] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Load room inventory
  useEffect(() => {
    async function loadRooms() {
      try {
        const roomsRef = collection(db, 'events', 'bajarun2026', 'roomInventory');
        const snapshot = await getDocs(roomsRef);
        const roomData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as RoomInventory[];
        setRooms(roomData);
      } catch (error) {
        console.error('Error loading rooms:', error);
      }
    }
    loadRooms();
  }, []);

  // Load registrations
  useEffect(() => {
    async function loadRegistrations() {
      try {
        const regsRef = collection(db, 'registrations');
        const snapshot = await getDocs(regsRef);
        const regData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Registration[];
        setRegistrations(regData);
      } catch (error) {
        console.error('Error loading registrations:', error);
      }
    }
    loadRegistrations();
  }, []);

  // Load user preferences (roommate preferences)
  useEffect(() => {
    async function loadUserPreferences() {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const prefs: { [uid: string]: UserData } = {};
        snapshot.docs.forEach(doc => {
          prefs[doc.id] = doc.data() as UserData;
        });
        setUserPreferences(prefs);
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }
    loadUserPreferences();
  }, []);

  // Load assignments for selected day (real-time)
  useEffect(() => {
    if (!user || !isAdmin) return;

    const assignmentRef = doc(db, 'events', 'bajarun2026', 'roomAssignments', `day${selectedDay}`);

    const unsubscribe = onSnapshot(assignmentRef, (docSnap) => {
      if (docSnap.exists()) {
        setAssignments(docSnap.data() as RoomAssignmentsDoc);
      } else {
        setAssignments({});
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading assignments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin, selectedDay]);

  // Filter rooms for selected day
  const dayRooms = useMemo(() => {
    return rooms
      .filter(r => r.day === selectedDay)
      .sort((a, b) => {
        // Sort camping last
        if (a.isCamping && !b.isCamping) return 1;
        if (!a.isCamping && b.isCamping) return -1;
        // Then by suite name
        return a.suiteName.localeCompare(b.suiteName);
      });
  }, [rooms, selectedDay]);

  // Get all assigned rider UIDs for current day
  const assignedRiderUids = useMemo(() => {
    return new Set(Object.values(assignments).map(a => a.oderId));
  }, [assignments]);

  // Get night key from day number (e.g., day 1 -> "night-1")
  const getNightKey = (day: number) => `night-${day}`;

  // Get user's selection for a specific day
  const getUserDaySelection = (uid: string, day: number): NightSelection | undefined => {
    const userData = userPreferences[uid];
    if (!userData?.accommodationSelections) return undefined;
    return userData.accommodationSelections[getNightKey(day)];
  };

  // Get all riders with their assignment status
  const allRiders = useMemo(() => {
    return registrations
      .map(r => {
        const selection = getUserDaySelection(r.id, selectedDay) || getUserDaySelection(r.uid, selectedDay);
        const isAssigned = assignedRiderUids.has(r.id) || assignedRiderUids.has(r.uid);
        return {
          ...r,
          preferredRoommate: userPreferences[r.id]?.preferredRoommate || userPreferences[r.uid]?.preferredRoommate,
          accommodation: selection?.accommodation || 'hotel',
          wantsSingleRoom: selection?.prefersSingleRoom || false,
          isAssigned
        };
      })
      .sort((a, b) => {
        // Sort unassigned first, then by name
        if (a.isAssigned !== b.isAssigned) return a.isAssigned ? 1 : -1;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [registrations, assignedRiderUids, userPreferences, selectedDay]);

  // Count unassigned
  const unassignedCount = allRiders.filter(r => !r.isAssigned).length;

  // Get full display name for a rider (from users collection or registration)
  const getFullDisplayName = (oderId: string, fallbackName: string): string => {
    // First try users collection displayName
    const userData = userPreferences[oderId];
    if (userData?.displayName) return userData.displayName;

    // Then try registration fullName
    const reg = registrations.find(r => r.id === oderId || r.uid === oderId);
    if (reg?.fullName) return reg.fullName;

    // Fallback
    return fallbackName;
  };

  // Handle rider selection
  const toggleRiderSelection = (riderId: string) => {
    setSelectedRiders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riderId)) {
        newSet.delete(riderId);
      } else {
        newSet.add(riderId);
      }
      return newSet;
    });
  };

  // Assign selected rider(s) to a room - couples can share a bed
  const assignToRoom = async (roomId: string) => {
    if (selectedRiders.size === 0) return;

    const room = dayRooms.find(r => r.id === roomId);
    if (!room) return;

    const selectedRiderIds = Array.from(selectedRiders);
    const newAssignments = { ...assignments };

    // For couples (2 selected), assign both to the first available bed
    if (selectedRiderIds.length === 2) {
      const firstAvailableBed = room.beds.find(bed => {
        const key = createRoomBedKey(roomId, bed);
        return !newAssignments[key];
      }) || room.beds[0];

      selectedRiderIds.forEach((riderId, idx) => {
        const rider = registrations.find(r => r.id === riderId || r.uid === riderId);
        if (!rider) return;

        // Use sub-key for each person: bed-1__0, bed-1__1
        const key = createRoomBedKey(roomId, firstAvailableBed) + `__${idx}`;

        newAssignments[key] = {
          oderId: rider.id || rider.uid,
          riderName: rider.fullName,
          assignedAt: new Date(),
          assignedBy: user?.uid || ''
        };
      });
    } else {
      // Single rider - assign to first available bed
      const availableBeds = room.beds.filter(bed => {
        // Check if bed has any assignments (including shared)
        return !Object.keys(newAssignments).some(k => k.startsWith(createRoomBedKey(roomId, bed)));
      });

      if (availableBeds.length === 0) return;

      selectedRiderIds.forEach((riderId, idx) => {
        if (idx >= availableBeds.length) return;
        const rider = registrations.find(r => r.id === riderId || r.uid === riderId);
        if (!rider) return;

        const bedName = availableBeds[idx];
        const assignmentKey = createRoomBedKey(roomId, bedName) + '__0';

        newAssignments[assignmentKey] = {
          oderId: rider.id || rider.uid,
          riderName: rider.fullName,
          assignedAt: new Date(),
          assignedBy: user?.uid || ''
        };
      });
    }

    setAssignments(newAssignments);
    setSelectedRiders(new Set());
    setHasChanges(true);
  };

  // Remove assignment from bed
  const removeAssignment = (roomBedKey: string) => {
    const newAssignments = { ...assignments };
    delete newAssignments[roomBedKey];
    setAssignments(newAssignments);
    setHasChanges(true);
  };

  // Save assignments to Firestore
  const saveAssignments = async () => {
    setSaving(true);
    try {
      const assignmentRef = doc(db, 'events', 'bajarun2026', 'roomAssignments', `day${selectedDay}`);
      await setDoc(assignmentRef, assignments);
      setHasChanges(false);
      alert('Assignments saved!');
    } catch (error) {
      console.error('Error saving assignments:', error);
      alert('Failed to save assignments.');
    } finally {
      setSaving(false);
    }
  };

  // Check if two riders prefer each other
  const isPreferenceMatch = (riderId: string, roommateId: string): boolean => {
    const riderPref = userPreferences[riderId]?.preferredRoommate;
    const roommatePref = userPreferences[roommateId]?.preferredRoommate;
    return riderPref === roommateId || roommatePref === riderId;
  };

  // Get last name for sorting
  const getLastName = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1].toLowerCase();
  };

  // Generate PDF of room assignments
  const generatePDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const dayInfo = DAY_INFO[selectedDay];

    // Header - centered
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const title = `Room Assignments - Day ${selectedDay}`;
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 20);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const subtitle = `${dayInfo.hotel} - ${dayInfo.location}`;
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 28);

    const dateText = dayInfo.date;
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, (pageWidth - dateWidth) / 2, 35);

    let yPos = 50;

    // Organize assignments by room
    const roomAssignmentsMap: { [roomId: string]: { roomName: string; riders: string[]; isCamping: boolean; isOwnAccommodation: boolean; bedCount: number } } = {};

    Object.entries(assignments).forEach(([key, assignment]) => {
      const { roomId } = parseRoomBedKey(key);
      const room = dayRooms.find(r => r.id === roomId);
      if (!room) return;

      const riderName = getFullDisplayName(assignment.oderId, assignment.riderName);

      if (!roomAssignmentsMap[roomId]) {
        roomAssignmentsMap[roomId] = {
          roomName: room.isCamping ? 'Camping' : room.isOwnAccommodation ? 'On Their Own' : `${room.suiteName}${room.roomNumber !== 'R1' ? ' ' + room.roomNumber : ''}`,
          riders: [],
          isCamping: !!room.isCamping,
          isOwnAccommodation: !!room.isOwnAccommodation,
          bedCount: room.beds?.length || 0
        };
      }
      roomAssignmentsMap[roomId].riders.push(riderName);
    });

    // Separate into categories based on number of beds in the room
    const singleRooms: { roomName: string; riders: string[] }[] = [];
    const doubleRooms: { roomName: string; riders: string[] }[] = [];
    const campers: string[] = [];
    const onTheirOwn: string[] = [];

    Object.values(roomAssignmentsMap).forEach(room => {
      if (room.isCamping) {
        campers.push(...room.riders);
      } else if (room.isOwnAccommodation) {
        onTheirOwn.push(...room.riders);
      } else if (room.bedCount === 1) {
        // Single room = 1 bed
        singleRooms.push({ roomName: room.roomName, riders: room.riders });
      } else {
        // Double/multi room = 2+ beds
        doubleRooms.push({ roomName: room.roomName, riders: room.riders });
      }
    });

    // Sort single rooms by first rider's last name
    singleRooms.sort((a, b) => getLastName(a.riders[0] || '').localeCompare(getLastName(b.riders[0] || '')));

    // Sort double rooms by first person's last name
    doubleRooms.sort((a, b) => getLastName(a.riders[0] || '').localeCompare(getLastName(b.riders[0] || '')));

    // Sort campers by last name
    campers.sort((a, b) => getLastName(a).localeCompare(getLastName(b)));

    // Sort on their own by last name
    onTheirOwn.sort((a, b) => getLastName(a).localeCompare(getLastName(b)));

    // Draw single rooms section
    if (singleRooms.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Single Rooms', 20, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      singleRooms.forEach(room => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(`${room.roomName}: ${room.riders.join(' & ')}`, 25, yPos);
        yPos += 6;
      });
      yPos += 8;
    }

    // Draw double rooms section
    if (doubleRooms.length > 0) {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Double Rooms', 20, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      doubleRooms.forEach(room => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(`${room.roomName}: ${room.riders.join(' & ')}`, 25, yPos);
        yPos += 6;
      });
      yPos += 8;
    }

    // Draw camping section
    if (campers.length > 0) {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Camping', 20, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      campers.forEach(camper => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(camper, 25, yPos);
        yPos += 6;
      });
    }

    // Draw on their own section
    if (onTheirOwn.length > 0) {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('On Their Own', 20, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      onTheirOwn.forEach(rider => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(rider, 25, yPos);
        yPos += 6;
      });
    }

    // Save PDF
    pdf.save(`room-assignments-day${selectedDay}.pdf`);
  };

  // Stats
  const stats = useMemo(() => {
    const totalBeds = dayRooms.reduce((sum, r) => sum + (r.isCamping || r.isOwnAccommodation ? 0 : r.beds.length), 0);
    const assignedBeds = Object.keys(assignments).filter(key => {
      const { roomId } = parseRoomBedKey(key);
      const room = dayRooms.find(r => r.id === roomId);
      return room && !room.isCamping && !room.isOwnAccommodation;
    }).length;
    const fullRooms = dayRooms.filter(room => {
      if (room.isCamping || room.isOwnAccommodation) return false;
      const roomAssignments = Object.keys(assignments).filter(key => key.startsWith(room.id + '__'));
      return roomAssignments.length === room.beds.length;
    }).length;
    return { totalBeds, assignedBeds, fullRooms, totalRooms: dayRooms.filter(r => !r.isCamping && !r.isOwnAccommodation).length };
  }, [dayRooms, assignments]);

  // Loading state
  if (authLoading || loading) {
    return (
      <AdminLayout title="Room Assignments">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Room Assignments">
      {/* Stats and Save bar */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span>{stats.assignedBeds}/{stats.totalBeds} beds</span>
          <span>{stats.fullRooms}/{stats.totalRooms} rooms full</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={saveAssignments}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {ROOM_ASSIGNMENT_DAYS.map(day => (
          <button
            key={day}
            onClick={() => {
              setSelectedDay(day);
              setSelectedRiders(new Set());
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDay === day
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Day {day} - {DAY_INFO[day].location}
          </button>
        ))}
      </div>

      {/* Main content - two panel layout */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Riders */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  Riders
                </h2>
                <span className="text-sm text-gray-500">{unassignedCount} unassigned</span>
              </div>
              {selectedRiders.size > 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  {selectedRiders.size} selected - click a room to assign
                </p>
              )}
            </div>

            <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
              {allRiders.map(rider => {
                const isSelected = selectedRiders.has(rider.id);
                const hasPreference = !!rider.preferredRoommate;

                return (
                  <div
                    key={rider.id}
                    onClick={() => !rider.isAssigned && toggleRiderSelection(rider.id)}
                    className={`px-4 py-3 transition-colors ${
                      rider.isAssigned
                        ? 'bg-green-50 opacity-60'
                        : isSelected
                          ? 'bg-amber-50 border-l-4 border-amber-500 cursor-pointer'
                          : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${rider.isAssigned ? 'text-gray-500' : 'text-gray-900'}`}>{rider.fullName}</p>
                        {/* Assigned checkmark */}
                        {rider.isAssigned && (
                          <span className="flex items-center justify-center w-5 h-5 bg-green-500 text-white rounded-full" title="Assigned">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                        {/* Accommodation type badge */}
                        {!rider.isAssigned && rider.accommodation === 'hotel' && (
                          <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded" title="Hotel">
                            <BedDouble className="h-3 w-3" />
                          </span>
                        )}
                        {!rider.isAssigned && rider.accommodation === 'camping' && (
                          <span className="flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded" title="Camping">
                            <Tent className="h-3 w-3" />
                          </span>
                        )}
                        {!rider.isAssigned && rider.accommodation === 'own' && (
                          <span className="flex items-center justify-center w-5 h-5 bg-gray-100 text-gray-600 rounded" title="Own accommodation">
                            <X className="h-3 w-3" />
                          </span>
                        )}
                        {/* Single room preference */}
                        {!rider.isAssigned && rider.wantsSingleRoom && (
                          <span className="flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-600 rounded" title="Prefers single room">
                            <User className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      {isSelected && !rider.isAssigned && (
                        <Check className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    {hasPreference && !rider.isAssigned && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-pink-600">
                        <Heart className="h-3 w-3" />
                        <span>Prefers: {rider.preferredRoommate}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {unassignedCount === 0 && (
                <div className="px-4 py-8 text-center text-green-600 font-medium">
                  All riders assigned!
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Room grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-gray-500" />
                  {DAY_INFO[selectedDay].hotel} - {DAY_INFO[selectedDay].date}
                </h2>
              </div>

              <div className="p-4 grid gap-4 sm:grid-cols-2">
                {dayRooms.filter(r => !r.isCamping).map(room => {
                  // Count beds that have at least one assignment
                  const bedsWithAssignments = room.beds.filter(bedName => {
                    const bedKeyPrefix = createRoomBedKey(room.id, bedName);
                    return Object.keys(assignments).some(k =>
                      k === bedKeyPrefix || k.startsWith(bedKeyPrefix + '__')
                    );
                  });
                  const roomAssignmentKeys = Object.keys(assignments).filter(
                    key => key.startsWith(room.id + '__')
                  );
                  const isFull = bedsWithAssignments.length === room.beds.length;

                  // Check if assignments in this room are preference matches
                  const assignedRiders = roomAssignmentKeys.map(key => assignments[key]);
                  const hasMatch = assignedRiders.length === 2 &&
                    isPreferenceMatch(assignedRiders[0].oderId, assignedRiders[1].oderId);

                  const availableBedCount = room.beds.length - bedsWithAssignments.length;
                  const canAssign = selectedRiders.size > 0 && availableBedCount > 0;

                  return (
                    <div
                      key={room.id}
                      onClick={() => canAssign && assignToRoom(room.id)}
                      className={`border rounded-lg p-3 transition-all ${
                        isFull
                          ? hasMatch
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300 bg-gray-50'
                          : canAssign
                            ? 'border-amber-400 bg-amber-50 cursor-pointer hover:border-amber-500 hover:shadow-md'
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          {room.suiteName}
                          {room.roomNumber !== 'R1' && ` ${room.roomNumber}`}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {roomAssignmentKeys.length} rider{roomAssignmentKeys.length !== 1 ? 's' : ''}
                          {isFull && <Check className="inline h-4 w-4 ml-1 text-green-600" />}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {room.beds.map(bedName => {
                          const bedKeyPrefix = createRoomBedKey(room.id, bedName);
                          // Find all assignments for this bed (handles couples sharing)
                          const bedAssignmentKeys = Object.keys(assignments).filter(k =>
                            k === bedKeyPrefix || k.startsWith(bedKeyPrefix + '__')
                          );
                          const bedAssignments = bedAssignmentKeys.map(k => ({ key: k, ...assignments[k] }));

                          if (bedAssignments.length > 0) {
                            return (
                              <div
                                key={bedKeyPrefix}
                                className="flex-1 bg-white border rounded px-2 py-1.5 group"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    {bedAssignments.map((a) => (
                                      <span key={a.key} className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                                        {getFullDisplayName(a.oderId, a.riderName)}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); removeAssignment(a.key); }}
                                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={bedKeyPrefix}
                              className={`flex-1 border border-dashed rounded px-2 py-1.5 text-sm flex items-center justify-center ${
                                canAssign
                                  ? 'border-amber-400 bg-amber-100 text-amber-700'
                                  : 'border-gray-300 text-gray-400'
                              }`}
                            >
                              <UserPlus className="h-4 w-4" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Camping section (for days that have it) */}
            {dayRooms.some(r => r.isCamping) && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Tent className="h-5 w-5 text-green-600" />
                    Camping
                  </h2>
                </div>

                <div className="p-4">
                  {dayRooms.filter(r => r.isCamping).map(room => {
                    const campingAssignments = Object.entries(assignments).filter(
                      ([k]) => k.startsWith(room.id + '__')
                    );

                    return (
                      <div key={room.id}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-600">
                            {campingAssignments.length} campers assigned
                          </span>
                          <button
                            onClick={() => {
                              if (selectedRiders.size === 0) return;
                              const riderId = Array.from(selectedRiders)[0];
                              const rider = registrations.find(r => r.id === riderId);
                              if (!rider) return;

                              const campKey = createRoomBedKey(room.id, `tent-${Date.now()}`);
                              const newAssignment: BedAssignment = {
                                oderId: rider.id,
                                riderName: rider.fullName,
                                assignedAt: new Date(),
                                assignedBy: user?.uid || ''
                              };
                              setAssignments(prev => ({ ...prev, [campKey]: newAssignment }));
                              setSelectedRiders(new Set());
                              setHasChanges(true);
                            }}
                            disabled={selectedRiders.size === 0}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              selectedRiders.size > 0
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Add Camper
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {campingAssignments.map(([k, assignment]) => (
                            <div
                              key={k}
                              className="bg-green-50 border border-green-200 rounded px-2 py-1 flex items-center gap-2 group"
                            >
                              <Tent className="h-3 w-3 text-green-600" />
                              <span className="text-sm text-gray-900">
                                {getFullDisplayName(assignment.oderId, assignment.riderName)}
                              </span>
                              <button
                                onClick={() => removeAssignment(k)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* On Their Own section */}
            {dayRooms.some(r => r.isOwnAccommodation) && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-purple-50 px-4 py-3 border-b">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Home className="h-5 w-5 text-purple-600" />
                    On Their Own
                  </h2>
                </div>

                <div className="p-4">
                  {dayRooms.filter(r => r.isOwnAccommodation).map(room => {
                    const ownAssignments = Object.entries(assignments).filter(
                      ([k]) => k.startsWith(room.id + '__')
                    );

                    return (
                      <div key={room.id}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-600">
                            {ownAssignments.length} on their own
                          </span>
                          <button
                            onClick={() => {
                              if (selectedRiders.size === 0) return;
                              const riderId = Array.from(selectedRiders)[0];
                              const rider = registrations.find(r => r.id === riderId);
                              if (!rider) return;

                              const ownKey = createRoomBedKey(room.id, `own-${Date.now()}`);
                              const newAssignment: BedAssignment = {
                                oderId: rider.id,
                                riderName: rider.fullName,
                                assignedAt: new Date(),
                                assignedBy: user?.uid || ''
                              };
                              setAssignments(prev => ({ ...prev, [ownKey]: newAssignment }));
                              setSelectedRiders(new Set());
                              setHasChanges(true);
                            }}
                            disabled={selectedRiders.size === 0}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              selectedRiders.size > 0
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Add Rider
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {ownAssignments.map(([k, assignment]) => (
                            <div
                              key={k}
                              className="bg-purple-50 border border-purple-200 rounded px-2 py-1 flex items-center gap-2 group"
                            >
                              <Home className="h-3 w-3 text-purple-600" />
                              <span className="text-sm text-gray-900">
                                {getFullDisplayName(assignment.oderId, assignment.riderName)}
                              </span>
                              <button
                                onClick={() => removeAssignment(k)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
