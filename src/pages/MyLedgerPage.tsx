/**
 * MyLedgerPage.tsx
 *
 * User-facing ledger page showing estimated charges, posted charges,
 * payments, and balance for the logged-in user.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import {
  Receipt,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { NightConfig, UserSelections, PaymentMethod } from '../types/eventConfig';
import { TRIP_NIGHTS } from '../types/eventConfig';

interface LedgerCharge {
  id: string;
  type: 'accommodation' | 'meal' | 'fee' | 'adjustment';
  description: string;
  amount: number;
  date: Date;
  postedBy: string;
  nightKey?: string;
}

interface LedgerPayment {
  id: string;
  amount: number;
  date: Date;
  method: PaymentMethod;
  recordedBy: string;
  note?: string;
}

export default function MyLedgerPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userSelections, setUserSelections] = useState<UserSelections>({});
  const [nightConfigs, setNightConfigs] = useState<{ [key: string]: NightConfig }>({});
  const [charges, setCharges] = useState<LedgerCharge[]>([]);
  const [payments, setPayments] = useState<LedgerPayment[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['estimates', 'charges', 'payments'])
  );

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) newSet.delete(section);
      else newSet.add(section);
      return newSet;
    });
  };

  // Load user data and ledger
  useEffect(() => {
    async function loadLedgerData() {
      if (!user) return;

      setLoading(true);
      try {
        // Load user's selections
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserSelections(userData.accommodationSelections || {});
        }

        // Load event pricing config
        const configDocRef = doc(db, 'eventConfig', 'pricing');
        const configDocSnap = await getDoc(configDocRef);
        if (configDocSnap.exists()) {
          const configData = configDocSnap.data();
          setNightConfigs(configData.nights || {});
        }

        // Load posted charges
        const chargesRef = collection(db, 'ledger', user.uid, 'charges');
        const chargesSnap = await getDocs(chargesRef);
        const loadedCharges: LedgerCharge[] = chargesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date()
        })) as LedgerCharge[];
        setCharges(loadedCharges);

        // Load payments
        const paymentsRef = collection(db, 'ledger', user.uid, 'payments');
        const paymentsSnap = await getDocs(paymentsRef);
        const loadedPayments: LedgerPayment[] = paymentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date()
        })) as LedgerPayment[];
        setPayments(loadedPayments);
      } catch (error) {
        console.error('Error loading ledger data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadLedgerData();
    }
  }, [user, authLoading]);

  // Calculate estimated charges from selections
  const calculateEstimatedCharges = (): { description: string; amount: number; nightKey?: string }[] => {
    const estimates: { description: string; amount: number; nightKey?: string }[] = [];

    TRIP_NIGHTS.forEach(night => {
      const selection = userSelections[night.key];
      const config = nightConfigs[night.key];
      if (!selection || !config) return;

      // Accommodation
      if (selection.accommodation === 'hotel' && config.hotelAvailable) {
        let hotelCost = config.hotelCost || 0;
        if (selection.prefersSingleRoom && config.singleRoomAvailable) {
          hotelCost = hotelCost * 2;
        }
        if (hotelCost > 0) {
          estimates.push({
            description: `${night.label} - Hotel${selection.prefersSingleRoom ? ' (Single)' : ''}`,
            amount: hotelCost,
            nightKey: night.key
          });
        }
      } else if (selection.accommodation === 'camping' && config.campingAvailable) {
        if (config.campingCost > 0) {
          estimates.push({
            description: `${night.label} - Camping`,
            amount: config.campingCost,
            nightKey: night.key
          });
        }
      }

      // Dinner
      if (selection.dinner && config.dinnerAvailable && config.dinnerCost > 0) {
        estimates.push({
          description: `${night.label} - Dinner`,
          amount: config.dinnerCost,
          nightKey: night.key
        });
      }

      // Breakfast
      if (selection.breakfast && config.breakfastAvailable && config.breakfastCost > 0) {
        estimates.push({
          description: `${night.label} - Breakfast`,
          amount: config.breakfastCost,
          nightKey: night.key
        });
      }
    });

    return estimates;
  };

  // Calculate totals
  const estimates = calculateEstimatedCharges();
  const totalEstimates = estimates.reduce((sum, e) => sum + e.amount, 0);
  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const estimatedBalance = totalEstimates - totalPayments;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Sign In Required</h2>
            <p className="text-slate-400 mb-6">Please sign in to view your ledger.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">My Ledger</h1>
              <p className="text-slate-400">Your charges and payments for the tour</p>
            </div>
          </div>
        </div>

        {/* Balance Summary Card */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            Balance Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Estimated Charges:</span>
              <span className="text-white">${totalEstimates.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Posted Charges:</span>
              <span className="text-white">${totalCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Payments Made:</span>
              <span className="text-green-400">${totalPayments.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-700 font-semibold">
              <span className="text-white">Estimated Balance:</span>
              <span className={estimatedBalance > 0 ? 'text-amber-400' : estimatedBalance < 0 ? 'text-green-400' : 'text-white'}>
                {estimatedBalance > 0
                  ? `$${estimatedBalance.toFixed(2)} owed`
                  : estimatedBalance < 0
                    ? `$${Math.abs(estimatedBalance).toFixed(2)} credit`
                    : '$0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Estimated Charges Accordion */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-4">
          <button
            onClick={() => toggleSection('estimates')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              <span className="text-white font-semibold">Estimated Charges</span>
              <span className="text-slate-400 text-sm">({estimates.length} items)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold">${totalEstimates.toFixed(2)}</span>
              {expandedSections.has('estimates') ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </button>
          {expandedSections.has('estimates') && (
            <div className="px-4 pb-4 border-t border-slate-700">
              {estimates.length === 0 ? (
                <p className="text-slate-400 text-sm pt-4">
                  No selections recorded. Please complete your accommodation preferences in{' '}
                  <Link to="/my-selections" className="text-blue-400 hover:text-blue-300">
                    Tour Details
                  </Link>.
                </p>
              ) : (
                <div className="space-y-2 pt-4">
                  {estimates.map((est, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-700/50 last:border-0">
                      <span className="text-slate-300">{est.description}</span>
                      <span className="text-slate-300">${est.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Posted Charges Accordion */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-4">
          <button
            onClick={() => toggleSection('charges')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-slate-400" />
              <span className="text-white font-semibold">Posted Charges</span>
              <span className="text-slate-400 text-sm">({charges.length} items)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold">${totalCharges.toFixed(2)}</span>
              {expandedSections.has('charges') ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </button>
          {expandedSections.has('charges') && (
            <div className="px-4 pb-4 border-t border-slate-700">
              {charges.length === 0 ? (
                <p className="text-slate-400 text-sm pt-4">
                  No charges have been posted yet. Posted charges appear here after the admin finalizes costs.
                </p>
              ) : (
                <div className="space-y-2 pt-4">
                  {charges.map(charge => (
                    <div key={charge.id} className="flex justify-between text-sm py-2 border-b border-slate-700/50 last:border-0">
                      <div>
                        <span className="text-slate-300">{charge.description}</span>
                        <span className="text-slate-500 text-xs ml-2">
                          {charge.date.toLocaleDateString()}
                        </span>
                      </div>
                      <span className={charge.amount >= 0 ? 'text-slate-300' : 'text-green-400'}>
                        {charge.amount >= 0 ? '' : '-'}${Math.abs(charge.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payments Accordion */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-4">
          <button
            onClick={() => toggleSection('payments')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-400" />
              <span className="text-white font-semibold">Payments Made</span>
              <span className="text-slate-400 text-sm">({payments.length} items)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400 font-semibold">${totalPayments.toFixed(2)}</span>
              {expandedSections.has('payments') ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </button>
          {expandedSections.has('payments') && (
            <div className="px-4 pb-4 border-t border-slate-700">
              {payments.length === 0 ? (
                <p className="text-slate-400 text-sm pt-4">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="space-y-2 pt-4">
                  {payments.map(payment => (
                    <div key={payment.id} className="flex justify-between text-sm py-2 border-b border-slate-700/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">
                          {payment.note || `Payment via ${payment.method}`}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {payment.date.toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-green-400">${payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mt-6">
          <p className="text-slate-400 text-sm">
            <strong className="text-slate-300">Note:</strong> Estimated charges are calculated based on your
            current tour selections. Final charges may vary and will be posted by the tour organizer as costs
            are confirmed. Contact the organizer if you have questions about your balance.
          </p>
        </div>
      </div>
    </div>
  );
}
