/**
 * RegistrationCleanupPage.tsx
 *
 * Admin tool to find and resolve duplicate registrations.
 * Shows registrations grouped by UID, highlights duplicates,
 * and allows selecting which record to keep.
 */

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  Check,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { db } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface RegistrationDoc {
  docId: string;
  uid: string;
  fullName?: string;
  email?: string;
  nickname?: string;
  bikeModel?: string;
  bikeYear?: string;
  phone?: string;
  city?: string;
  state?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  amtCollected?: number;
  depositPaid?: number;
  // Flag to indicate if docId matches uid
  docIdMatchesUid: boolean;
  // All raw data for comparison
  rawData: Record<string, any>;
}

interface GroupedRegistrations {
  uid: string;
  registrations: RegistrationDoc[];
  hasDuplicates: boolean;
  hasIdMismatch: boolean;
}

export default function RegistrationCleanupPage() {
  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupedRegistrations[]>([]);
  const [expandedUids, setExpandedUids] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyIssues, setShowOnlyIssues] = useState(true);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);

    try {
      const snapshot = await getDocs(collection(db, 'registrations'));
      const allDocs: RegistrationDoc[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          docId: d.id,
          uid: data.uid || '',
          fullName: data.fullName,
          email: data.email,
          nickname: data.nickname,
          bikeModel: data.bikeModel,
          bikeYear: data.bikeYear,
          phone: data.phone,
          city: data.city,
          state: data.state,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          amtCollected: data.amtCollected,
          depositPaid: data.depositPaid,
          docIdMatchesUid: d.id === data.uid,
          rawData: data
        };
      });

      // Group by uid
      const groupMap = new Map<string, RegistrationDoc[]>();
      allDocs.forEach(doc => {
        const key = doc.uid || `no-uid-${doc.docId}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, []);
        }
        groupMap.get(key)!.push(doc);
      });

      // Convert to array and add flags
      const grouped: GroupedRegistrations[] = Array.from(groupMap.entries()).map(([uid, regs]) => ({
        uid,
        registrations: regs.sort((a, b) => {
          // Sort: matching docId first, then by createdAt
          if (a.docIdMatchesUid && !b.docIdMatchesUid) return -1;
          if (!a.docIdMatchesUid && b.docIdMatchesUid) return 1;
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime; // Newest first
        }),
        hasDuplicates: regs.length > 1,
        hasIdMismatch: regs.some(r => !r.docIdMatchesUid)
      }));

      // Sort: issues first, then by name
      grouped.sort((a, b) => {
        if (a.hasDuplicates && !b.hasDuplicates) return -1;
        if (!a.hasDuplicates && b.hasDuplicates) return 1;
        if (a.hasIdMismatch && !b.hasIdMismatch) return -1;
        if (!a.hasIdMismatch && b.hasIdMismatch) return 1;
        const aName = a.registrations[0]?.fullName || '';
        const bName = b.registrations[0]?.fullName || '';
        return aName.localeCompare(bName);
      });

      setGroups(grouped);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRegistrations();
    }
  }, [isAdmin]);

  const handleDelete = async (docId: string) => {
    const confirmMsg = `Are you sure you want to DELETE this registration document?\n\nDoc ID: ${docId}\n\nThis cannot be undone!`;
    if (!confirm(confirmMsg)) return;

    setDeleting(docId);
    try {
      await deleteDoc(doc(db, 'registrations', docId));
      // Refresh data
      await fetchRegistrations();
    } catch (err) {
      console.error('Error deleting:', err);
      setError('Failed to delete registration');
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpand = (uid: string) => {
    setExpandedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const formatDate = (ts?: Timestamp) => {
    if (!ts) return 'N/A';
    return new Date(ts.seconds * 1000).toLocaleString();
  };

  // Stats
  const totalRegistrations = groups.reduce((sum, g) => sum + g.registrations.length, 0);
  const uniqueUsers = groups.length;
  const duplicateGroups = groups.filter(g => g.hasDuplicates).length;
  const mismatchedIds = groups.filter(g => g.hasIdMismatch && !g.hasDuplicates).length;

  const filteredGroups = showOnlyIssues
    ? groups.filter(g => g.hasDuplicates || g.hasIdMismatch)
    : groups;

  if (loading) {
    return (
      <AdminLayout title="Registration Cleanup">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Registration Cleanup">
      <div className="max-w-6xl mx-auto">
        {/* Subtitle */}
        <p className="text-slate-400 text-sm mb-6">
          Find and resolve duplicate or mismatched registrations
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="text-2xl font-bold text-white">{totalRegistrations}</div>
            <div className="text-sm text-slate-400">Total Documents</div>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="text-2xl font-bold text-white">{uniqueUsers}</div>
            <div className="text-sm text-slate-400">Unique UIDs</div>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className={`text-2xl font-bold ${duplicateGroups > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {duplicateGroups}
            </div>
            <div className="text-sm text-slate-400">With Duplicates</div>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className={`text-2xl font-bold ${mismatchedIds > 0 ? 'text-amber-400' : 'text-green-400'}`}>
              {mismatchedIds}
            </div>
            <div className="text-sm text-slate-400">ID Mismatches Only</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={showOnlyIssues}
              onChange={(e) => setShowOnlyIssues(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-blue-500"
            />
            Show only records with issues
          </label>
          <button
            onClick={fetchRegistrations}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-600/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Legend */}
        <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700 text-sm">
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-slate-300">Duplicate UIDs</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">Doc ID ≠ UID</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-slate-300">Doc ID = UID (correct)</span>
            </span>
          </div>
        </div>

        {/* Registration Groups */}
        <div className="space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
              <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-white font-medium">No issues found!</p>
              <p className="text-slate-400 text-sm mt-1">All registrations are properly configured.</p>
            </div>
          ) : (
            filteredGroups.map(group => {
              const isExpanded = expandedUids.has(group.uid) || group.hasDuplicates;
              const primaryReg = group.registrations[0];

              return (
                <div
                  key={group.uid}
                  className={`bg-slate-800 rounded-lg border overflow-hidden ${
                    group.hasDuplicates
                      ? 'border-red-500/50'
                      : group.hasIdMismatch
                      ? 'border-amber-500/50'
                      : 'border-slate-700'
                  }`}
                >
                  {/* Group Header */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/50"
                    onClick={() => toggleExpand(group.uid)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {primaryReg?.fullName || 'Unknown'}
                          </span>
                          {group.hasDuplicates && (
                            <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full">
                              {group.registrations.length} duplicates
                            </span>
                          )}
                          {!group.hasDuplicates && group.hasIdMismatch && (
                            <span className="px-2 py-0.5 bg-amber-600/20 text-amber-400 text-xs rounded-full">
                              ID mismatch
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400">
                          {primaryReg?.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      UID: {group.uid.substring(0, 20)}...
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-700">
                      {group.registrations.map((reg, idx) => (
                        <div
                          key={reg.docId}
                          className={`p-4 ${idx > 0 ? 'border-t border-slate-700' : ''} ${
                            reg.docIdMatchesUid ? 'bg-green-900/10' : 'bg-amber-900/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Document Info */}
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`w-2 h-2 rounded-full ${
                                  reg.docIdMatchesUid ? 'bg-green-500' : 'bg-amber-500'
                                }`}></span>
                                <span className="text-sm font-medium text-white">
                                  Document {idx + 1}
                                </span>
                                {reg.docIdMatchesUid ? (
                                  <span className="text-xs text-green-400">(Doc ID = UID - CORRECT)</span>
                                ) : (
                                  <span className="text-xs text-amber-400">(Doc ID ≠ UID - NEEDS FIX)</span>
                                )}
                              </div>

                              {/* IDs */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono mb-3">
                                <div>
                                  <span className="text-slate-500">Doc ID: </span>
                                  <span className={reg.docIdMatchesUid ? 'text-green-400' : 'text-amber-400'}>
                                    {reg.docId}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">UID field: </span>
                                  <span className="text-slate-300">{reg.uid}</span>
                                </div>
                              </div>

                              {/* Key Fields */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <div className="text-slate-500 text-xs">Name</div>
                                  <div className="text-slate-200">{reg.fullName || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-xs">Email</div>
                                  <div className="text-slate-200">{reg.email || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-xs">Bike</div>
                                  <div className="text-slate-200">{reg.bikeYear} {reg.bikeModel || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-xs">Phone</div>
                                  <div className="text-slate-200">{reg.phone || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-xs">Created</div>
                                  <div className="text-slate-200">{formatDate(reg.createdAt)}</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-xs">Updated</div>
                                  <div className="text-slate-200">{formatDate(reg.updatedAt)}</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-xs">Amt Collected</div>
                                  <div className="text-slate-200">${reg.amtCollected || 0}</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-xs">Location</div>
                                  <div className="text-slate-200">{reg.city}, {reg.state}</div>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              {group.hasDuplicates && (
                                <button
                                  onClick={() => handleDelete(reg.docId)}
                                  disabled={deleting === reg.docId}
                                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded-lg"
                                >
                                  {deleting === reg.docId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            How to Clean Up
          </h3>
          <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
            <li><strong>Duplicates (Red):</strong> Compare the records and delete the one you don't want to keep. Usually keep the one with more recent data or the one where Doc ID = UID.</li>
            <li><strong>ID Mismatches (Amber):</strong> After resolving duplicates, we'll run a migration script to fix documents where Doc ID ≠ UID.</li>
            <li><strong>Verify:</strong> After cleanup, check that "With Duplicates" shows 0.</li>
          </ol>
        </div>
      </div>
    </AdminLayout>
  );
}
