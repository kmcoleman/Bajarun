/**
 * EmailComposer.tsx
 *
 * Email composer with template support.
 * Allows selecting from saved templates or writing custom emails.
 * Templates stored in Firestore.
 */

import { useState, useEffect } from 'react';
import {
  Send,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
  Plus,
  Trash2,
  Save,
  X,
  Edit2
} from 'lucide-react';
import { db, functions } from '../lib/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description?: string;
  isSpecial?: boolean; // For special templates like "Tour Update"
  createdAt?: any;
  updatedAt?: any;
}

interface Registration {
  id: string;
  uid: string;
  fullName: string;
  nickname?: string;
  email: string;
}

interface NightConfig {
  hotelAvailable: boolean;
  campingAvailable: boolean;
  dinnerAvailable: boolean;
  breakfastAvailable: boolean;
  optionalActivities?: Array<{ id: string; title: string; cost: number; description: string }>;
}

interface NightSelection {
  accommodation?: string;
  breakfast?: boolean;
  dinner?: boolean;
  optionalActivitiesInterested?: string[];
  prefersSingleRoom?: boolean;
}

interface UserSelections {
  [night: string]: NightSelection;
}

interface EmailComposerProps {
  registrations: Registration[];
}

export default function EmailComposer({ registrations }: EmailComposerProps) {
  // Template state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Template editor state
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Email compose state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailRecipients, setEmailRecipients] = useState<'all' | 'selected'>('all');
  const [selectedRecipientUids, setSelectedRecipientUids] = useState<string[]>([]);

  // Sending state
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Night configs for Tour Update template
  const [nightConfigs, setNightConfigs] = useState<Record<string, NightConfig>>({});

  // Load templates from Firestore
  useEffect(() => {
    loadTemplates();
    loadNightConfigs();
  }, []);

  const loadTemplates = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'emailTemplates'));
      const loaded: EmailTemplate[] = [];
      snapshot.forEach((doc) => {
        loaded.push({ id: doc.id, ...doc.data() } as EmailTemplate);
      });
      // Sort by name
      loaded.sort((a, b) => a.name.localeCompare(b.name));
      setTemplates(loaded);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadNightConfigs = async () => {
    try {
      const configRef = doc(db, 'eventConfig', 'pricing');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        if (data.nights) {
          setNightConfigs(data.nights);
        }
      }
    } catch (error) {
      console.error('Error loading night configs:', error);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setEmailError(null);
    setEmailResult(null);

    if (templateId === 'custom') {
      setEmailSubject('');
      setEmailBody('');
    } else if (templateId === 'tour-update') {
      setEmailSubject('Baja Tour 2026 - Tour Update & Registration Confirmation');
      setEmailBody('[This template generates personalized content for each rider including their registration info and selections]');
    } else {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setEmailSubject(template.subject);
        setEmailBody(template.body);
      }
    }
  };

  // Recipient management
  const toggleRecipient = (uid: string) => {
    setSelectedRecipientUids(prev =>
      prev.includes(uid)
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  };

  const selectAllRecipients = () => {
    setSelectedRecipientUids(registrations.map(r => r.uid));
  };

  const deselectAllRecipients = () => {
    setSelectedRecipientUids([]);
  };

  // Get recipients based on selection
  const getRecipients = () => {
    if (emailRecipients === 'all') {
      return registrations;
    }
    return registrations.filter(r => selectedRecipientUids.includes(r.uid));
  };

  // Build personalized email HTML for Tour Update template
  const buildTourUpdateEmail = async (reg: Registration): Promise<string> => {
    // Fetch user selections
    let selections: UserSelections = {};
    try {
      const userDoc = await getDoc(doc(db, 'users', reg.uid));
      if (userDoc.exists()) {
        selections = userDoc.data().accommodationSelections || {};
      }
    } catch (e) {
      console.error('Error fetching user selections:', e);
    }

    const firstName = reg.nickname || reg.fullName.split(' ')[0];
    const nightsHtml = buildNightsHtml(selections);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Baja Tour 2026 - Update</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 35px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; }
    .content { padding: 35px; }
    h2 { font-size: 20px; color: #1e3a5f; margin: 30px 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .night-row { background-color: #f9fafb; border-radius: 6px; padding: 12px 15px; margin-bottom: 10px; }
    .night-title { font-weight: 600; color: #1e3a5f; margin-bottom: 5px; }
    .footer { background-color: #f9fafb; padding: 25px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Baja Tour 2026</h1>
      <p>Tour Update</p>
    </div>
    <div class="content">
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>Here is your current registration information and selections for the Baja Tour 2026.</p>

      <h2>Your Nightly Selections</h2>
      ${nightsHtml}

      <p style="margin-top: 30px;">If you need to make any changes, please reply to this email.</p>
      <p>See you on the road!<br><strong>Kevin Coleman</strong><br>Tour Organizer</p>
    </div>
    <div class="footer">
      <p>Baja Tour 2026 | March 19-27, 2026</p>
      <p><a href="https://bajarun.ncmotoadv.com">bajarun.ncmotoadv.com</a></p>
    </div>
  </div>
</body>
</html>`;
  };

  // Build nights HTML for tour update
  const buildNightsHtml = (selections: UserSelections): string => {
    const nights = [
      { key: 'night-1', label: 'Night 1', location: 'Temecula, CA' },
      { key: 'night-2', label: 'Night 2', location: 'Rancho Meling, BC' },
      { key: 'night-3', label: 'Night 3', location: 'Laguna Ojo de Liebre, BCS' },
      { key: 'night-4', label: 'Night 4', location: 'Playa El Burro, BCS' },
      { key: 'night-5', label: 'Night 5', location: 'Playa El Burro, BCS (Rest Day)' },
      { key: 'night-6', label: 'Night 6', location: 'Bahia de los Angeles, BC' },
      { key: 'night-7', label: 'Night 7', location: 'Tecate, BC' },
      { key: 'night-8', label: 'Night 8', location: 'Twentynine Palms, CA' },
    ];

    return nights.map(night => {
      const sel = selections[night.key] || {};
      const config = nightConfigs[night.key] || {};
      const accommodation = sel.accommodation || '';

      // Build available options text
      const availableOptions: string[] = [];
      if (config.hotelAvailable) availableOptions.push('Hotel');
      if (config.campingAvailable) availableOptions.push('Camping');
      availableOptions.push('Own arrangements');

      let availableText = availableOptions.length === 2
        ? `${availableOptions[0]} or ${availableOptions[1]}`
        : `${availableOptions.slice(0, -1).join(', ')}, or ${availableOptions[availableOptions.length - 1]}`;

      // Selection text
      let selectionText = 'Not yet selected';
      if (accommodation === 'hotel') selectionText = 'Hotel ✓';
      else if (accommodation === 'camping') selectionText = 'Camping ✓';
      else if (accommodation === 'own') selectionText = 'Own arrangements ✓';

      // Meals
      let mealsHtml = '';
      if (config.dinnerAvailable || config.breakfastAvailable) {
        const mealsAvailable = [];
        if (config.dinnerAvailable) mealsAvailable.push('Dinner');
        if (config.breakfastAvailable) mealsAvailable.push('Breakfast');

        const mealsSelected = [];
        if (sel.dinner) mealsSelected.push('Dinner ✓');
        if (sel.breakfast) mealsSelected.push('Breakfast ✓');

        mealsHtml = `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="color: #6b7280; font-size: 13px;">Meals available: ${mealsAvailable.join(' and ')}</div>
            <div style="color: #111827; font-weight: 500; margin-top: 2px;">Your selection: ${mealsSelected.length > 0 ? mealsSelected.join(', ') : 'None selected'}</div>
          </div>`;
      }

      return `
        <div class="night-row">
          <div class="night-title">${night.label} - ${night.location}</div>
          <div style="color: #6b7280; font-size: 13px;">Accommodation available: ${availableText}</div>
          <div style="color: #111827; font-weight: 500; margin-top: 2px;">Your selection: ${selectionText}</div>
          ${mealsHtml}
        </div>`;
    }).join('');
  };

  // Build simple template email with placeholders replaced
  const buildTemplateEmail = (template: string, reg: Registration): string => {
    const firstName = reg.nickname || reg.fullName.split(' ')[0];

    let html = template
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{fullName\}\}/g, reg.fullName)
      .replace(/\{\{email\}\}/g, reg.email)
      .replace(/\n/g, '<br />');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 35px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 35px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Baja Tour 2026</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${firstName}</strong>,</p>
      <div>${html}</div>
    </div>
    <div class="footer">
      <p>Baja Tour 2026 | March 19-27, 2026</p>
    </div>
  </div>
</body>
</html>`;
  };

  // Send emails
  const handleSendEmail = async () => {
    const recipients = getRecipients();
    if (recipients.length === 0) {
      setEmailError('Please select at least one recipient');
      return;
    }

    if (selectedTemplateId === 'custom' && (!emailSubject.trim() || !emailBody.trim())) {
      setEmailError('Please enter a subject and message');
      return;
    }

    setSendingEmail(true);
    setEmailError(null);
    setEmailResult(null);

    try {
      const emails: Array<{ to: string; subject: string; html: string }> = [];

      for (const reg of recipients) {
        let html: string;

        if (selectedTemplateId === 'tour-update') {
          html = await buildTourUpdateEmail(reg);
        } else {
          html = buildTemplateEmail(emailBody, reg);
        }

        emails.push({
          to: reg.email,
          subject: emailSubject.replace(/\{\{firstName\}\}/g, reg.nickname || reg.fullName.split(' ')[0]),
          html
        });
      }

      const sendFn = httpsCallable(functions, 'sendPersonalizedEmails');
      const response = await sendFn({ emails });
      const data = response.data as { sent: number; failed: number };
      setEmailResult(data);
    } catch (error: any) {
      console.error('Error sending emails:', error);
      setEmailError(error.message || 'Failed to send emails');
    } finally {
      setSendingEmail(false);
    }
  };

  // Template CRUD
  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !emailSubject.trim() || !emailBody.trim()) {
      return;
    }

    setSavingTemplate(true);
    try {
      const templateData = {
        name: templateName.trim(),
        subject: emailSubject,
        body: emailBody,
        description: templateDescription.trim(),
        updatedAt: new Date()
      };

      if (editingTemplate) {
        await updateDoc(doc(db, 'emailTemplates', editingTemplate.id), templateData);
      } else {
        await addDoc(collection(db, 'emailTemplates'), {
          ...templateData,
          createdAt: new Date()
        });
      }

      await loadTemplates();
      setShowTemplateEditor(false);
      setEditingTemplate(null);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setEmailSubject(template.subject);
    setEmailBody(template.body);
    setShowTemplateEditor(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteDoc(doc(db, 'emailTemplates', templateId));
      await loadTemplates();
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('custom');
        setEmailSubject('');
        setEmailBody('');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setShowTemplateEditor(true);
  };

  const recipientCount = emailRecipients === 'all' ? registrations.length : selectedRecipientUids.length;

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Email Template
          </h3>
          <button
            onClick={handleNewTemplate}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>

        {loadingTemplates ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Custom Email Option */}
            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedTemplateId === 'custom' ? 'border-blue-500 bg-blue-600/10' : 'border-slate-600 hover:bg-slate-700/50'
            }`}>
              <input
                type="radio"
                name="template"
                checked={selectedTemplateId === 'custom'}
                onChange={() => handleTemplateSelect('custom')}
                className="h-4 w-4 text-blue-600"
              />
              <div>
                <span className="text-white font-medium">Custom Email</span>
                <p className="text-slate-400 text-sm">Write a new email from scratch</p>
              </div>
            </label>

            {/* Tour Update Special Template */}
            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedTemplateId === 'tour-update' ? 'border-blue-500 bg-blue-600/10' : 'border-slate-600 hover:bg-slate-700/50'
            }`}>
              <input
                type="radio"
                name="template"
                checked={selectedTemplateId === 'tour-update'}
                onChange={() => handleTemplateSelect('tour-update')}
                className="h-4 w-4 text-blue-600"
              />
              <div className="flex-1">
                <span className="text-white font-medium">Tour Update (Personalized)</span>
                <p className="text-slate-400 text-sm">Full personalized email with rider data and selections</p>
              </div>
              <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded-full">Special</span>
            </label>

            {/* Saved Templates */}
            {templates.map(template => (
              <div key={template.id} className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                selectedTemplateId === template.id ? 'border-blue-500 bg-blue-600/10' : 'border-slate-600 hover:bg-slate-700/50'
              }`}>
                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    checked={selectedTemplateId === template.id}
                    onChange={() => handleTemplateSelect(template.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div>
                    <span className="text-white font-medium">{template.name}</span>
                    {template.description && (
                      <p className="text-slate-400 text-sm">{template.description}</p>
                    )}
                  </div>
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                    title="Edit template"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="bg-slate-800 rounded-xl border border-blue-500 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h3>
            <button
              onClick={() => {
                setShowTemplateEditor(false);
                setEditingTemplate(null);
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-1">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Payment Reminder"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-1">Description (optional)</label>
              <input
                type="text"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief description of when to use this template"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowTemplateEditor(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateName.trim() || !emailSubject.trim() || !emailBody.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Compose */}
        <div className="space-y-6">
          {/* Recipient Selection */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recipients</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                <input
                  type="radio"
                  name="recipients"
                  checked={emailRecipients === 'all'}
                  onChange={() => setEmailRecipients('all')}
                  className="h-4 w-4 text-blue-600"
                />
                <Users className="h-5 w-5 text-slate-400" />
                <span className="text-white">All Participants ({registrations.length})</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                <input
                  type="radio"
                  name="recipients"
                  checked={emailRecipients === 'selected'}
                  onChange={() => setEmailRecipients('selected')}
                  className="h-4 w-4 text-blue-600"
                />
                <CheckCircle className="h-5 w-5 text-slate-400" />
                <span className="text-white">Selected Participants ({selectedRecipientUids.length})</span>
              </label>

              {emailRecipients === 'selected' && (
                <div className="ml-8 mt-2">
                  <div className="flex gap-2 mb-3">
                    <button onClick={selectAllRecipients} className="text-sm text-blue-400 hover:text-blue-300">
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button onClick={deselectAllRecipients} className="text-sm text-blue-400 hover:text-blue-300">
                      Deselect All
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {registrations.map((reg) => (
                      <label key={reg.id} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRecipientUids.includes(reg.uid)}
                          onChange={() => toggleRecipient(reg.uid)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-slate-300 text-sm">{reg.fullName}</span>
                        <span className="text-slate-500 text-xs">({reg.email})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <label className="block text-white font-semibold mb-2">Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter email subject..."
              disabled={selectedTemplateId === 'tour-update'}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-slate-500">
              Use {'{{firstName}}'} to insert recipient's first name
            </p>
          </div>

          {/* Body */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <label className="block text-white font-semibold mb-2">Message</label>
            {selectedTemplateId === 'tour-update' ? (
              <div className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-400 text-sm">
                This template automatically generates personalized content for each rider including their registration info and nightly selections.
                <br /><br />
                <a href="/admin/tour-update-email" className="text-blue-400 hover:text-blue-300">
                  → Preview the full Tour Update email format
                </a>
              </div>
            ) : (
              <>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Enter your message..."
                  rows={10}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Available placeholders: {'{{firstName}}'}, {'{{fullName}}'}, {'{{email}}'}
                </p>
              </>
            )}
          </div>

          {/* Error/Success Messages */}
          {emailError && (
            <div className="flex items-center gap-2 p-4 bg-red-600/10 border border-red-500/30 rounded-lg text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          {emailResult && (
            <div className="flex items-center gap-2 p-4 bg-green-600/10 border border-green-500/30 rounded-lg text-green-400">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>
                Sent successfully to {emailResult.sent} recipient{emailResult.sent !== 1 ? 's' : ''}
                {emailResult.failed > 0 && ` (${emailResult.failed} failed)`}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Preview'}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || recipientCount === 0 || (selectedTemplateId !== 'tour-update' && (!emailSubject.trim() || !emailBody.trim()))}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sendingEmail ? 'Sending...' : `Send to ${recipientCount} Recipient${recipientCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        {/* Right Column - Preview */}
        {showPreview && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-700">
              <span className="text-sm font-medium text-slate-400">Email Preview</span>
            </div>
            <div className="p-6">
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '30px', textAlign: 'center' }}>
                  <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px' }}>Baja Tour 2026</h1>
                </div>
                <div style={{ padding: '30px' }}>
                  <p style={{ color: '#374151', margin: '0 0 20px 0', fontSize: '16px' }}>
                    Hi <strong>[First Name]</strong>,
                  </p>
                  {selectedTemplateId === 'tour-update' ? (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                      [Personalized tour update content with rider data and selections will appear here]
                    </p>
                  ) : (
                    <div
                      style={{ color: '#374151', fontSize: '16px', lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{
                        __html: (emailBody || 'Message body goes here...').replace(/\n/g, '<br />'),
                      }}
                    />
                  )}
                </div>
                <div style={{ backgroundColor: '#f9fafb', padding: '20px', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>Baja Tour 2026 | March 19-27, 2026</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
