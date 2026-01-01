/**
 * EmailSystemPage.tsx
 *
 * NEW Email System Admin Page - Configurable templates, triggers, and manual sending.
 * This is completely separate from existing email functionality.
 *
 * TO DELETE THIS SYSTEM:
 * 1. Delete this file
 * 2. Remove route from App.tsx
 * 3. Remove menu link from Layout.tsx
 * 4. Delete emailSystem.ts from functions
 * 5. Remove export from functions/src/index.ts
 * 6. Delete Firestore collections: emailTriggers, emailLog
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  limit,
} from 'firebase/firestore';
import {
  Mail,
  Zap,
  Send,
  History,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronRight,
  Users,
  RefreshCw,
} from 'lucide-react';

// Admin UID
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

// Types
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: string;
  variables: Array<{ name: string; description: string; example: string }>;
  sampleData?: Record<string, string>;
}

interface EmailTrigger {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  templateId: string;
  triggerType: 'firestore' | 'manual';
  collection?: string;
  event?: 'create' | 'update' | 'delete';
  conditions?: Array<{ field: string; operator: string; value: string }>;
  recipientField: string;
  dataMapping: Record<string, string>;
  lastTriggered?: Timestamp;
  sendCount?: number;
}

interface EmailLogEntry {
  id: string;
  triggerId: string | null;
  templateId: string;
  templateName: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: Timestamp;
  sentBy: string;
}

interface Rider {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  firstName: string;
  phone?: string;
  city?: string;
  state?: string;
  bikeYear?: string;
  bikeModel?: string;
  balance?: number;
}

type TabType = 'triggers' | 'send' | 'log';

export default function EmailSystemPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('send');

  // Data
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [triggers, setTriggers] = useState<EmailTrigger[]>([]);
  const [logEntries, setLogEntries] = useState<EmailLogEntry[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);

  // UI state
  const [, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<EmailTrigger | null>(null);
  const [showTriggerModal, setShowTriggerModal] = useState(false);

  // Send email state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedRiders, setSelectedRiders] = useState<Set<string>>(new Set());
  const [riderSearch, setRiderSearch] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Check admin access
  useEffect(() => {
    if (user && user.uid !== ADMIN_UID) {
      navigate('/');
    }
  }, [user, navigate]);

  // Load templates
  useEffect(() => {
    const q = query(collection(db, 'emailTemplates'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailTemplate[];
      setTemplates(data);
    });
    return () => unsubscribe();
  }, []);

  // Load triggers
  useEffect(() => {
    const q = query(collection(db, 'emailTriggers'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailTrigger[];
      setTriggers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load email log
  useEffect(() => {
    const q = query(collection(db, 'emailLog'), orderBy('sentAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailLogEntry[];
      setLogEntries(data);
    });
    return () => unsubscribe();
  }, []);

  // Load riders
  useEffect(() => {
    const loadRiders = async () => {
      try {
        const functions = getFunctions();
        const getRiders = httpsCallable(functions, 'emailSystemGetRiders');
        const result = await getRiders();
        setRiders((result.data as { riders: Rider[] }).riders);
      } catch (error) {
        console.error('Failed to load riders:', error);
      }
    };
    loadRiders();
  }, []);

  // Filter riders by search
  const filteredRiders = riders.filter((rider) => {
    const search = riderSearch.toLowerCase();
    return (
      rider.fullName?.toLowerCase().includes(search) ||
      rider.email?.toLowerCase().includes(search) ||
      rider.city?.toLowerCase().includes(search)
    );
  });

  // Toggle trigger enabled
  const toggleTrigger = async (trigger: EmailTrigger) => {
    try {
      await updateDoc(doc(db, 'emailTriggers', trigger.id), {
        enabled: !trigger.enabled,
      });
    } catch (error) {
      console.error('Failed to toggle trigger:', error);
    }
  };

  // Delete trigger
  const deleteTrigger = async (triggerId: string) => {
    if (!confirm('Are you sure you want to delete this trigger?')) return;
    try {
      await deleteDoc(doc(db, 'emailTriggers', triggerId));
    } catch (error) {
      console.error('Failed to delete trigger:', error);
    }
  };

  // Save trigger
  const saveTrigger = async (trigger: Partial<EmailTrigger>) => {
    try {
      if (trigger.id) {
        await updateDoc(doc(db, 'emailTriggers', trigger.id), trigger);
      } else {
        const newId = `trigger-${Date.now()}`;
        await setDoc(doc(db, 'emailTriggers', newId), {
          ...trigger,
          id: newId,
          sendCount: 0,
        });
      }
      setShowTriggerModal(false);
      setEditingTrigger(null);
    } catch (error) {
      console.error('Failed to save trigger:', error);
    }
  };

  // Preview email
  const handlePreview = async () => {
    if (!selectedTemplate || selectedRiders.size === 0) return;

    const firstRiderId = Array.from(selectedRiders)[0];
    const rider = riders.find((r) => r.id === firstRiderId);
    if (!rider) return;

    try {
      const functions = getFunctions();
      const preview = httpsCallable(functions, 'emailSystemPreview');
      const result = await preview({
        templateId: selectedTemplate,
        data: {
          fullName: rider.fullName,
          firstName: rider.firstName,
          email: rider.email,
          phone: rider.phone || '',
          city: rider.city || '',
          state: rider.state || '',
          bikeYear: rider.bikeYear || '',
          bikeModel: rider.bikeModel || '',
          bike: `${rider.bikeYear || ''} ${rider.bikeModel || ''}`.trim(),
          balance: rider.balance || 0,
        },
      });
      const data = result.data as { subject: string; html: string };
      setPreviewSubject(data.subject);
      setPreviewHtml(data.html);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to preview:', error);
      alert('Failed to generate preview');
    }
  };

  // Send emails
  const handleSend = async () => {
    if (!selectedTemplate || selectedRiders.size === 0) return;

    const confirmed = confirm(
      `Send email to ${selectedRiders.size} recipient(s)?`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const recipients = Array.from(selectedRiders).map((riderId) => {
        const rider = riders.find((r) => r.id === riderId)!;
        return {
          email: rider.email,
          data: {
            fullName: rider.fullName,
            firstName: rider.firstName,
            email: rider.email,
            phone: rider.phone || '',
            city: rider.city || '',
            state: rider.state || '',
            bikeYear: rider.bikeYear || '',
            bikeModel: rider.bikeModel || '',
            bike: `${rider.bikeYear || ''} ${rider.bikeModel || ''}`.trim(),
            balance: rider.balance || 0,
          },
        };
      });

      const functions = getFunctions();
      const sendBulk = httpsCallable(functions, 'emailSystemSendBulk');
      const result = await sendBulk({
        templateId: selectedTemplate,
        recipients,
      });

      const data = result.data as { sent: number; failed: number };
      alert(`Sent: ${data.sent}, Failed: ${data.failed}`);
      setSelectedRiders(new Set());
      setActiveTab('log');
    } catch (error) {
      console.error('Failed to send:', error);
      alert('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  // Send test email to self
  const handleSendTest = async () => {
    if (!selectedTemplate || !user?.email) return;

    setSending(true);
    try {
      const functions = getFunctions();
      const sendOne = httpsCallable(functions, 'emailSystemSendOne');
      await sendOne({
        templateId: selectedTemplate,
        recipient: user.email,
        data: {
          fullName: 'Test User',
          firstName: 'Test',
          email: user.email,
          phone: '555-1234',
          city: 'San Francisco',
          state: 'CA',
          bikeYear: '2024',
          bikeModel: 'R1250GS',
          bike: '2024 R1250GS',
          balance: 500,
        },
      });
      alert(`Test email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send test:', error);
      alert('Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  if (!user || user.uid !== ADMIN_UID) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Email System</h1>
            <span className="px-2 py-1 bg-amber-600/20 text-amber-400 text-xs rounded-full">
              NEW - Testing
            </span>
          </div>
          <p className="text-slate-400">
            Configure email templates, automated triggers, and send manual emails.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 pb-4">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'send'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Send className="h-4 w-4" />
            Send Email
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'triggers'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="h-4 w-4" />
            Triggers
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'log'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            Email Log
          </button>
          <a
            href="/admin/email-templates"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
          >
            <Edit2 className="h-4 w-4" />
            Edit Templates
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Send Email Tab */}
        {activeTab === 'send' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Template & Recipients */}
            <div className="space-y-6">
              {/* Template Selection */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-400" />
                  Select Template
                </h3>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="mt-4 p-4 bg-slate-900 rounded-lg">
                    <p className="text-slate-400 text-sm">
                      Subject:{' '}
                      <span className="text-white">
                        {templates.find((t) => t.id === selectedTemplate)?.subject}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Recipient Selection */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-400" />
                  Select Recipients
                  <span className="ml-auto text-sm font-normal text-slate-400">
                    {selectedRiders.size} selected
                  </span>
                </h3>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search riders..."
                    value={riderSearch}
                    onChange={(e) => setRiderSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Quick select */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedRiders(new Set(riders.map((r) => r.id)))}
                    className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedRiders(new Set())}
                    className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                  >
                    Clear
                  </button>
                </div>

                {/* Rider list */}
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredRiders.map((rider) => (
                    <label
                      key={rider.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedRiders.has(rider.id)
                          ? 'bg-blue-600/20 border border-blue-500/50'
                          : 'bg-slate-900 hover:bg-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRiders.has(rider.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedRiders);
                          if (e.target.checked) {
                            newSet.add(rider.id);
                          } else {
                            newSet.delete(rider.id);
                          }
                          setSelectedRiders(newSet);
                        }}
                        className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {rider.fullName}
                        </p>
                        <p className="text-slate-400 text-sm truncate">
                          {rider.email}
                        </p>
                      </div>
                      {rider.balance && rider.balance > 0 && (
                        <span className="text-amber-400 text-sm">
                          ${rider.balance}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Preview & Actions */}
            <div className="space-y-6">
              {/* Actions */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handlePreview}
                    disabled={!selectedTemplate || selectedRiders.size === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Preview Email
                  </button>
                  <button
                    onClick={handleSendTest}
                    disabled={!selectedTemplate || sending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Test to Me
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!selectedTemplate || selectedRiders.size === 0 || sending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send to {selectedRiders.size} Recipient(s)
                  </button>
                </div>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Preview</h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 bg-slate-900">
                    <p className="text-slate-400 text-sm mb-2">
                      Subject: <span className="text-white">{previewSubject}</span>
                    </p>
                  </div>
                  <div
                    className="bg-white"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Triggers Tab */}
        {activeTab === 'triggers' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-400">
                Configure automated emails that send when events occur.
              </p>
              <button
                onClick={() => {
                  setEditingTrigger({
                    id: '',
                    name: '',
                    description: '',
                    enabled: false,
                    templateId: '',
                    triggerType: 'firestore',
                    collection: 'registrations',
                    event: 'create',
                    conditions: [],
                    recipientField: 'email',
                    dataMapping: {},
                  });
                  setShowTriggerModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Trigger
              </button>
            </div>

            {triggers.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                <Zap className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No triggers configured yet.</p>
                <p className="text-slate-500 text-sm mt-1">
                  Create a trigger to automatically send emails on events.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {triggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleTrigger(trigger)}
                          className={`mt-1 ${
                            trigger.enabled ? 'text-green-400' : 'text-slate-500'
                          }`}
                        >
                          {trigger.enabled ? (
                            <ToggleRight className="h-6 w-6" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" />
                          )}
                        </button>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {trigger.name}
                          </h3>
                          <p className="text-slate-400 text-sm mt-1">
                            {trigger.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-slate-500">
                              Template:{' '}
                              <span className="text-slate-300">
                                {templates.find((t) => t.id === trigger.templateId)?.name ||
                                  trigger.templateId}
                              </span>
                            </span>
                            <span className="text-slate-500">
                              Trigger:{' '}
                              <span className="text-slate-300">
                                {trigger.collection}.{trigger.event}
                              </span>
                            </span>
                            {trigger.sendCount !== undefined && (
                              <span className="text-slate-500">
                                Sent:{' '}
                                <span className="text-slate-300">{trigger.sendCount}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTrigger(trigger);
                            setShowTriggerModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTrigger(trigger.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Email Log Tab */}
        {activeTab === 'log' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-400">
                Recent email activity from the new email system.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-3 py-1 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            {logEntries.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                <History className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No emails sent yet.</p>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                        Recipient
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                        Template
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                        Sent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {logEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          {entry.status === 'sent' ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <Check className="h-4 w-4" />
                              Sent
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white">{entry.recipient}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {entry.templateName}
                        </td>
                        <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                          {entry.subject}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {entry.sentAt?.toDate?.()?.toLocaleString() || 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Trigger Modal */}
        {showTriggerModal && editingTrigger && (
          <TriggerModal
            trigger={editingTrigger}
            templates={templates}
            onSave={saveTrigger}
            onClose={() => {
              setShowTriggerModal(false);
              setEditingTrigger(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Trigger Edit Modal
function TriggerModal({
  trigger,
  templates,
  onSave,
  onClose,
}: {
  trigger: EmailTrigger;
  templates: EmailTemplate[];
  onSave: (trigger: Partial<EmailTrigger>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EmailTrigger>(trigger);
  const [newCondition, setNewCondition] = useState({ field: '', operator: '==', value: '' });
  const [newMapping, setNewMapping] = useState({ key: '', value: '' });

  const handleAddCondition = () => {
    if (!newCondition.field) return;
    setForm({
      ...form,
      conditions: [...(form.conditions || []), { ...newCondition }],
    });
    setNewCondition({ field: '', operator: '==', value: '' });
  };

  const handleRemoveCondition = (index: number) => {
    setForm({
      ...form,
      conditions: form.conditions?.filter((_, i) => i !== index),
    });
  };

  const handleAddMapping = () => {
    if (!newMapping.key || !newMapping.value) return;
    setForm({
      ...form,
      dataMapping: { ...form.dataMapping, [newMapping.key]: newMapping.value },
    });
    setNewMapping({ key: '', value: '' });
  };

  const handleRemoveMapping = (key: string) => {
    const newMapping = { ...form.dataMapping };
    delete newMapping[key];
    setForm({ ...form, dataMapping: newMapping });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {trigger.id ? 'Edit Trigger' : 'New Trigger'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., Welcome Email"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., Sent when a new rider registers"
              />
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email Template</label>
            <select
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Config */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Collection</label>
              <select
                value={form.collection}
                onChange={(e) => setForm({ ...form, collection: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="registrations">registrations</option>
                <option value="users">users</option>
                <option value="waitlist">waitlist</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Event</label>
              <select
                value={form.event}
                onChange={(e) =>
                  setForm({ ...form, event: e.target.value as 'create' | 'update' | 'delete' })
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="create">On Create</option>
                <option value="update">On Update</option>
              </select>
            </div>
          </div>

          {/* Recipient Field */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Recipient Email Field
            </label>
            <input
              type="text"
              value={form.recipientField}
              onChange={(e) => setForm({ ...form, recipientField: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., email"
            />
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Conditions (optional)
            </label>
            {form.conditions && form.conditions.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.conditions.map((cond, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg"
                  >
                    <span className="text-slate-300">
                      {cond.field} {cond.operator} {cond.value}
                    </span>
                    <button
                      onClick={() => handleRemoveCondition(i)}
                      className="ml-auto text-slate-500 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Field"
                value={newCondition.field}
                onChange={(e) =>
                  setNewCondition({ ...newCondition, field: e.target.value })
                }
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <select
                value={newCondition.operator}
                onChange={(e) =>
                  setNewCondition({ ...newCondition, operator: e.target.value })
                }
                className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="==">==</option>
                <option value="!=">!=</option>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="contains">contains</option>
                <option value="exists">exists</option>
              </select>
              <input
                type="text"
                placeholder="Value"
                value={newCondition.value}
                onChange={(e) =>
                  setNewCondition({ ...newCondition, value: e.target.value })
                }
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddCondition}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Data Mapping */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Data Mapping (template variable → document field)
            </label>
            {Object.keys(form.dataMapping || {}).length > 0 && (
              <div className="space-y-2 mb-3">
                {Object.entries(form.dataMapping).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg"
                  >
                    <span className="text-blue-400">{`{{${key}}}`}</span>
                    <span className="text-slate-500">←</span>
                    <span className="text-slate-300">{value}</span>
                    <button
                      onClick={() => handleRemoveMapping(key)}
                      className="ml-auto text-slate-500 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Template var (e.g., fullName)"
                value={newMapping.key}
                onChange={(e) => setNewMapping({ ...newMapping, key: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Document field (e.g., fullName)"
                value={newMapping.value}
                onChange={(e) => setNewMapping({ ...newMapping, value: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddMapping}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.templateId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Trigger
          </button>
        </div>
      </div>
    </div>
  );
}
