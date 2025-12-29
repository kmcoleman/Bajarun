/**
 * My Ledger - Shows balance, payments, and transaction history
 * Based on Stitch mockup: my_ledger
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';

type FilterType = 'all' | 'payments' | 'charges';
type PaymentMethod = 'venmo' | 'zelle' | 'cash';

interface LedgerCharge {
  id: string;
  type: 'accommodation' | 'meal' | 'fee' | 'adjustment';
  description: string;
  amount: number;
  date: Date;
  nightKey?: string;
}

interface LedgerPayment {
  id: string;
  amount: number;
  date: Date;
  method: PaymentMethod;
  note?: string;
}

interface Transaction {
  id: string;
  type: 'payment' | 'charge';
  title: string;
  description: string;
  amount: number;
  date: Date;
  status: string;
}

export default function MyLedgerPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');
  const [charges, setCharges] = useState<LedgerCharge[]>([]);
  const [payments, setPayments] = useState<LedgerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ledger data from Firestore
  useEffect(() => {
    async function fetchLedgerData() {
      if (!user?.uid) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch charges
        const chargesRef = collection(db, 'ledger', user.uid, 'charges');
        const chargesSnap = await getDocs(chargesRef);
        const chargesData = chargesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
        })) as LedgerCharge[];

        // Fetch payments
        const paymentsRef = collection(db, 'ledger', user.uid, 'payments');
        const paymentsSnap = await getDocs(paymentsRef);
        const paymentsData = paymentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
        })) as LedgerPayment[];

        setCharges(chargesData);
        setPayments(paymentsData);
      } catch (err) {
        console.error('Error fetching ledger data:', err);
        setError('Failed to load ledger data');
      } finally {
        setLoading(false);
      }
    }

    fetchLedgerData();
  }, [user?.uid]);

  // Convert to unified transaction format
  const transactions: Transaction[] = [
    ...charges.map(c => ({
      id: c.id,
      type: 'charge' as const,
      title: c.type.charAt(0).toUpperCase() + c.type.slice(1),
      description: c.description,
      amount: c.amount,
      date: c.date,
      status: 'billed',
    })),
    ...payments.map(p => ({
      id: p.id,
      type: 'payment' as const,
      title: 'Payment',
      description: p.method ? `${p.method.charAt(0).toUpperCase() + p.method.slice(1)}${p.note ? ` - ${p.note}` : ''}` : (p.note || 'Payment'),
      amount: -p.amount, // Negative for payments
      date: p.date,
      status: 'settled',
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Calculate totals
  const totalBilled = charges.reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalBilled - totalPaid;
  const paymentProgress = totalBilled > 0 ? Math.min((totalPaid / totalBilled) * 100, 100) : 100;

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'payments') return t.type === 'payment';
    if (filter === 'charges') return t.type === 'charge';
    return true;
  });

  const formatCurrency = (amount: number) => {
    const prefix = amount >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return { month, day };
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Ledger</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading ledger...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Ledger</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <LinearGradient
          colors={['#0d59f2', '#1d4ed8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.decorativeCircle} />
          <Text style={styles.balanceLabel}>Current Balance Due</Text>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Payment Progress</Text>
              <Text style={styles.progressPercent}>{Math.round(paymentProgress)}% Paid</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${paymentProgress}%` }]} />
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: theme.accent + '15' }]}>
                <FontAwesome name="file-text-o" size={14} color={theme.accent} />
              </View>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>TOTAL BILLED</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>${totalBilled.toFixed(2)}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: theme.success + '15' }]}>
                <FontAwesome name="credit-card" size={14} color={theme.success} />
              </View>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>TOTAL PAID</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>${totalPaid.toFixed(2)}</Text>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <View style={styles.transactionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Transaction History</Text>
            <TouchableOpacity>
              <Text style={[styles.downloadLink, { color: theme.accent }]}>Download PDF</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filter === 'all'
                  ? { backgroundColor: theme.accent }
                  : { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
              ]}
              onPress={() => setFilter('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === 'all' ? '#ffffff' : theme.textSecondary },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filter === 'payments'
                  ? { backgroundColor: theme.accent }
                  : { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
              ]}
              onPress={() => setFilter('payments')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === 'payments' ? '#ffffff' : theme.textSecondary },
                ]}
              >
                Payments
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filter === 'charges'
                  ? { backgroundColor: theme.accent }
                  : { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
              ]}
              onPress={() => setFilter('charges')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === 'charges' ? '#ffffff' : theme.textSecondary },
                ]}
              >
                Charges
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Transaction List */}
          <View style={styles.transactionList}>
            {filteredTransactions.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <FontAwesome name="inbox" size={32} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No transactions yet</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                  {filter === 'all'
                    ? 'Your charges and payments will appear here'
                    : `No ${filter} to display`}
                </Text>
              </View>
            ) : (
              filteredTransactions.map((transaction) => {
                const { month, day } = formatDate(transaction.date);
                const isPayment = transaction.type === 'payment';

                return (
                  <View
                    key={transaction.id}
                    style={[styles.transactionItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  >
                    <View style={[styles.dateBox, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
                      <Text style={[styles.dateMonth, { color: theme.textMuted }]}>{month}</Text>
                      <Text style={[styles.dateDay, { color: theme.textPrimary }]}>{day}</Text>
                    </View>

                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionTitle, { color: theme.textPrimary }]}>
                        {transaction.title}
                      </Text>
                      <Text style={[styles.transactionDesc, { color: theme.textMuted }]}>
                        {transaction.description}
                      </Text>
                    </View>

                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: isPayment ? theme.success : theme.textPrimary },
                        ]}
                      >
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <Text style={[styles.transactionStatus, { color: theme.textMuted }]}>
                        {transaction.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Help Link */}
          <TouchableOpacity style={styles.helpLink}>
            <FontAwesome name="question-circle-o" size={14} color={theme.textMuted} />
            <Text style={[styles.helpText, { color: theme.textMuted }]}>Need help with a charge?</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  // Balance Card
  balanceCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceLabel: {
    color: 'rgba(191, 219, 254, 1)',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: spacing.xl,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    color: 'rgba(191, 219, 254, 1)',
    fontSize: 11,
    fontWeight: '500',
  },
  progressPercent: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  // Transaction Section
  transactionSection: {
    marginBottom: spacing.lg,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  downloadLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Filter Chips
  filterContainer: {
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Transaction List
  transactionList: {
    gap: spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionStatus: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  // Help Link
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  helpText: {
    fontSize: 14,
  },
});
