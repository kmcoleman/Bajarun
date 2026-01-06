/**
 * PostChargePage.tsx
 *
 * Admin page for posting charges to multiple riders' ledgers at once.
 * Allows selecting date, type, description, amount, and target riders.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import {
  Receipt,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckSquare,
  Square,
  DollarSign,
  Calendar,
  FileText,
  Users,
  Check
} from 'lucide-react';

// Admin UID
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

// Charge types
const CHARGE_TYPES = [
  { value: 'lodging', label: 'Lodging' },
  { value: 'camping', label: 'Camping' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'activity', label: 'Activity' },
  { value: 'other', label: 'Other' },
];

interface Rider {
  id: string;
  uid: string;
  fullName: string;
  email: string;
}

export default function PostChargePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRiders, setSelectedRiders] = useState<Set<string>>(new Set());

  // Form state
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [chargeType, setChargeType] = useState('lodging');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Success/error state
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load registered riders
  useEffect(() => {
    async function loadRiders() {
      try {
        const registrationsRef = collection(db, 'registrations');
        const snapshot = await getDocs(registrationsRef);
        const ridersList: Rider[] = snapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.data().uid,
          fullName: doc.data().fullName || 'Unknown',
          email: doc.data().email || '',
        }));
        // Sort alphabetically by name
        ridersList.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setRiders(ridersList);
      } catch (err) {
        console.error('Error loading riders:', err);
        setError('Failed to load riders');
      } finally {
        setLoading(false);
      }
    }

    if (user?.uid === ADMIN_UID) {
      loadRiders();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Toggle rider selection
  const toggleRider = (uid: string) => {
    setSelectedRiders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uid)) {
        newSet.delete(uid);
      } else {
        newSet.add(uid);
      }
      return newSet;
    });
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedRiders.size === riders.length) {
      setSelectedRiders(new Set());
    } else {
      setSelectedRiders(new Set(riders.map(r => r.uid)));
    }
  };

  // Check if all are selected
  const allSelected = riders.length > 0 && selectedRiders.size === riders.length;

  // Post charges to selected riders
  const handlePostCharges = async () => {
    if (selectedRiders.size === 0) {
      setError('Please select at least one rider');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum === 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setPosting(true);
    setError(null);
    setSuccessCount(null);

    try {
      const chargeData = {
        type: chargeType,
        description: description.trim(),
        amount: amountNum,
        date: Timestamp.fromDate(new Date(chargeDate)),
        postedBy: user?.email || 'admin',
        postedAt: Timestamp.now(),
      };

      let posted = 0;
      for (const uid of selectedRiders) {
        try {
          const chargesRef = collection(db, 'ledger', uid, 'charges');
          await addDoc(chargesRef, chargeData);
          posted++;
        } catch (err) {
          console.error(`Error posting charge to ${uid}:`, err);
        }
      }

      setSuccessCount(posted);

      // Reset form after successful post
      if (posted > 0) {
        setDescription('');
        setAmount('');
        setSelectedRiders(new Set());
      }
    } catch (err) {
      console.error('Error posting charges:', err);
      setError('Failed to post charges');
    } finally {
      setPosting(false);
    }
  };

  // Auth check
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user || user.uid !== ADMIN_UID) {
    return (
      <div className="min-h-screen bg-slate-900 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Post Charge</h1>
              <p className="text-slate-400">Post charges to multiple riders' ledgers</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successCount !== null && (
          <div className="bg-green-600/20 border border-green-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
            <p className="text-green-300">
              Successfully posted charge to {successCount} rider{successCount !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-600/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Charge Details Form */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Charge Details
            </h2>

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={chargeDate}
                  onChange={(e) => setChargeDate(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={chargeType}
                  onChange={(e) => setChargeType(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CHARGE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Night 1 - Hotel San Quintin"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Use negative amount for credits/refunds
                </p>
              </div>
            </div>
          </div>

          {/* Rider Selection */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Select Riders ({selectedRiders.size}/{riders.length})
              </h2>
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                {allSelected ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    Select All
                  </>
                )}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1 pr-2">
              {riders.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No registered riders found</p>
              ) : (
                riders.map(rider => (
                  <label
                    key={rider.uid}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRiders.has(rider.uid)
                        ? 'bg-blue-600/20 border border-blue-500/50'
                        : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRiders.has(rider.uid)}
                      onChange={() => toggleRider(rider.uid)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      selectedRiders.has(rider.uid)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-transparent'
                    }`}>
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{rider.fullName}</p>
                      <p className="text-slate-400 text-sm truncate">{rider.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Post Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePostCharges}
            disabled={posting || selectedRiders.size === 0}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {posting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Receipt className="h-5 w-5" />
                Post Charge to {selectedRiders.size} Rider{selectedRiders.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Preview */}
        {selectedRiders.size > 0 && amount && description && (
          <div className="mt-6 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Preview</h3>
            <p className="text-slate-300">
              Posting <span className="text-white font-semibold">${parseFloat(amount || '0').toFixed(2)}</span> charge
              for "<span className="text-white">{description}</span>" ({chargeType})
              to <span className="text-blue-400 font-semibold">{selectedRiders.size}</span> rider{selectedRiders.size !== 1 ? 's' : ''}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
