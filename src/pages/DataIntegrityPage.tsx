/**
 * DataIntegrityPage.tsx
 *
 * Admin diagnostic tool to identify mismatches between
 * registration doc IDs and user collection doc IDs,
 * and show how this affects accommodation lookups.
 */

import { useState, useEffect } from 'react';
import {
  Loader2,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface RegistrationDoc {
  docId: string;
  uid: string;
  fullName: string;
}

interface UserDoc {
  docId: string;
  displayName?: string;
  accommodationSelections?: {
    [nightKey: string]: {
      accommodation?: 'hotel' | 'camping' | 'own';
    };
  };
}

interface DiagnosticRow {
  fullName: string;
  regDocId: string;
  regUidField: string;
  idsMatch: boolean;
  userDocExistsById: boolean;
  userDocExistsByUid: boolean;
  accommodationsByNight: { [night: string]: string };
  issue: string;
}

export default function DataIntegrityPage() {
  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticRow[]>([]);
  const [filterIssuesOnly, setFilterIssuesOnly] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load registrations
      const regsSnap = await getDocs(collection(db, 'registrations'));
      const registrations: RegistrationDoc[] = regsSnap.docs.map(doc => ({
        docId: doc.id,
        uid: doc.data().uid || '',
        fullName: doc.data().fullName || 'Unknown'
      }));

      // Load users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap: { [id: string]: UserDoc } = {};
      usersSnap.docs.forEach(doc => {
        usersMap[doc.id] = {
          docId: doc.id,
          displayName: doc.data().displayName,
          accommodationSelections: doc.data().accommodationSelections
        };
      });

      // Build diagnostic rows
      const rows: DiagnosticRow[] = registrations.map(reg => {
        const idsMatch = reg.docId === reg.uid;
        const userDocExistsById = !!usersMap[reg.docId];
        const userDocExistsByUid = !!usersMap[reg.uid];

        // Get accommodations from whichever user doc we can find
        const userDoc = usersMap[reg.docId] || usersMap[reg.uid];
        const accommodationsByNight: { [night: string]: string } = {};

        for (let i = 1; i <= 8; i++) {
          const nightKey = `night-${i}`;
          const selection = userDoc?.accommodationSelections?.[nightKey];
          accommodationsByNight[nightKey] = selection?.accommodation || 'none';
        }

        // Determine issue
        let issue = '';
        if (!idsMatch) {
          if (!userDocExistsByUid) {
            issue = 'ID mismatch + no user doc for UID';
          } else if (!userDocExistsById) {
            issue = 'ID mismatch (user doc exists by UID)';
          } else {
            issue = 'ID mismatch (user docs exist for both)';
          }
        } else if (!userDocExistsById) {
          issue = 'No user doc exists';
        }

        return {
          fullName: reg.fullName,
          regDocId: reg.docId,
          regUidField: reg.uid,
          idsMatch,
          userDocExistsById,
          userDocExistsByUid,
          accommodationsByNight,
          issue
        };
      });

      // Sort: issues first, then by name
      rows.sort((a, b) => {
        if (a.issue && !b.issue) return -1;
        if (!a.issue && b.issue) return 1;
        return a.fullName.localeCompare(b.fullName);
      });

      setDiagnostics(rows);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const filteredRows = filterIssuesOnly
    ? diagnostics.filter(d => d.issue)
    : diagnostics;

  const issueCount = diagnostics.filter(d => d.issue).length;

  // Export to CSV
  const exportCSV = () => {
    const headers = [
      'Full Name',
      'Reg Doc ID',
      'UID Field',
      'IDs Match',
      'User Doc by ID',
      'User Doc by UID',
      'Issue',
      'Night 1',
      'Night 2',
      'Night 3',
      'Night 4',
      'Night 5',
      'Night 6',
      'Night 7',
      'Night 8'
    ];

    const rows = diagnostics.map(d => [
      d.fullName,
      d.regDocId,
      d.regUidField,
      d.idsMatch ? 'Yes' : 'No',
      d.userDocExistsById ? 'Yes' : 'No',
      d.userDocExistsByUid ? 'Yes' : 'No',
      d.issue || 'OK',
      d.accommodationsByNight['night-1'],
      d.accommodationsByNight['night-2'],
      d.accommodationsByNight['night-3'],
      d.accommodationsByNight['night-4'],
      d.accommodationsByNight['night-5'],
      d.accommodationsByNight['night-6'],
      d.accommodationsByNight['night-7'],
      d.accommodationsByNight['night-8']
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data-integrity-report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout title="Data Integrity Check">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Data Integrity Check">
      <div className="max-w-7xl mx-auto">
        {/* Summary */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-white">{diagnostics.length}</div>
                <div className="text-sm text-slate-400">Total Registrations</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${issueCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {issueCount}
                </div>
                <div className="text-sm text-slate-400">With Issues</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-slate-300 text-sm">
                <input
                  type="checkbox"
                  checked={filterIssuesOnly}
                  onChange={(e) => setFilterIssuesOnly(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-amber-500"
                />
                Show issues only
              </label>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-medium mb-1">How Room Assignments lookups work:</p>
              <ol className="list-decimal ml-4 space-y-1 text-amber-300">
                <li>First tries to find user doc by <code className="bg-amber-900/50 px-1 rounded">registration.docId</code></li>
                <li>Falls back to <code className="bg-amber-900/50 px-1 rounded">registration.uid</code> field</li>
                <li>If neither found, defaults to "hotel"</li>
              </ol>
              <p className="mt-2">Records with <strong>ID mismatch</strong> where the UID lookup works are OK. Issues occur when neither lookup finds a user doc.</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium">Reg Doc ID</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium">UID Field</th>
                  <th className="text-center px-4 py-3 text-slate-300 font-medium">IDs Match</th>
                  <th className="text-center px-4 py-3 text-slate-300 font-medium">User by ID</th>
                  <th className="text-center px-4 py-3 text-slate-300 font-medium">User by UID</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium">Issue</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium">Nights 1-8</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className={row.issue ? 'bg-red-900/10' : ''}>
                    <td className="px-4 py-3 text-white font-medium">{row.fullName}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{row.regDocId.substring(0, 12)}...</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {row.regUidField ? `${row.regUidField.substring(0, 12)}...` : <span className="text-red-400">EMPTY</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.idsMatch ? (
                        <Check className="h-4 w-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.userDocExistsById ? (
                        <Check className="h-4 w-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-slate-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.userDocExistsByUid ? (
                        <Check className="h-4 w-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.issue ? (
                        <span className="text-red-400 text-xs">{row.issue}</span>
                      ) : (
                        <span className="text-green-400 text-xs">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
                          const accom = row.accommodationsByNight[`night-${n}`];
                          const color = accom === 'hotel' ? 'bg-blue-500' :
                            accom === 'camping' ? 'bg-green-500' :
                            accom === 'own' ? 'bg-slate-500' : 'bg-red-500';
                          const label = accom === 'hotel' ? 'H' :
                            accom === 'camping' ? 'C' :
                            accom === 'own' ? 'O' : '?';
                          return (
                            <span
                              key={n}
                              className={`w-5 h-5 ${color} rounded text-white text-xs flex items-center justify-center`}
                              title={`Night ${n}: ${accom}`}
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 && (
            <div className="p-8 text-center">
              <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-white font-medium">No issues found!</p>
              <p className="text-slate-400 text-sm">All registration IDs match their user docs.</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-white font-medium mb-2">Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center">H</span>
              <span className="text-slate-300">Hotel</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 bg-green-500 rounded text-white text-xs flex items-center justify-center">C</span>
              <span className="text-slate-300">Camping</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 bg-slate-500 rounded text-white text-xs flex items-center justify-center">O</span>
              <span className="text-slate-300">Own</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center">?</span>
              <span className="text-slate-300">No selection (defaults to Hotel in Room Assignments)</span>
            </span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
