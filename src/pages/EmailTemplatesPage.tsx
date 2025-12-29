/**
 * EmailTemplatesPage.tsx
 *
 * Admin page for managing email templates stored in Firestore.
 * Templates use Handlebars syntax ({{variable}}) for dynamic content.
 */

import { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Code,
  FileText,
  Copy,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Admin UID - only this user can access
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  variables: TemplateVariable[];
  sampleData: Record<string, string>;
  lastUpdated?: Timestamp;
  updatedBy?: string;
}

interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

// Default templates based on current hardcoded emails
const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'lastUpdated' | 'updatedBy'>[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Sent automatically when a new user registers for the tour',
    subject: 'Welcome to BMW Baja Tour 2026, {{fullName}}!',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">
                Welcome to the Adventure!
              </h1>
              <p style="color: #bfdbfe; font-size: 16px; margin: 0;">
                BMW Baja Tour 2026
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hey {{nickname}}! 🏍️
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You're officially registered for the <strong>BMW Baja Tour 2026</strong>! We're excited to have you and your <strong>{{bikeYear}} {{bikeModel}}</strong> joining us for this incredible adventure through Baja California.
              </p>

              <!-- Registration Details -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h2 style="color: #1e40af; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
                  Your Registration Details
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Name</td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">{{fullName}}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Motorcycle</td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">{{bikeYear}} {{bikeModel}}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Location</td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">{{city}}, {{state}}</td>
                  </tr>
                </table>
              </div>

              <!-- Next Steps -->
              <h2 style="color: #1e40af; font-size: 18px; font-weight: 600; margin: 25px 0 15px 0;">
                What's Next?
              </h2>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                <strong style="color: #1e40af;">Submit Your Deposit</strong><br/>
                Secure your spot by sending your $500 deposit via Venmo (@KevinColeman72) or Zelle (kevincoleman72@icloud.com).
              </p>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                <strong style="color: #1e40af;">Tour Selections</strong> (Profile Menu)<br/>
                Choose your accommodations and meals for each night of the tour.
              </p>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                <strong style="color: #1e40af;">Upload Documents</strong> (Profile Menu)<br/>
                Store your passport, license, and insurance docs for easy access.
              </p>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                <strong style="color: #1e40af;">Info Tab</strong> (Main Menu)<br/>
                Review Mexico entry requirements and insurance information.
              </p>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                <strong style="color: #1e40af;">User Guide</strong> (Support Menu)<br/>
                Need help navigating the website? Check out our <a href="https://bajarun.ncmotoadv.com/guide" style="color: #1e40af;">User Guide</a> for step-by-step instructions.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://bajarun.ncmotoadv.com" style="display: inline-block; background-color: #1e40af; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Visit Your Dashboard
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Questions? Reply to this email or post in the Discussion forum.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
                BMW Baja Tour 2026
              </p>
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                NorCal Moto Adventures
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    variables: [
      { name: 'fullName', description: 'Rider full name', example: 'John Smith' },
      { name: 'nickname', description: 'Rider nickname or first name', example: 'Johnny' },
      { name: 'bikeYear', description: 'Motorcycle year', example: '2023' },
      { name: 'bikeModel', description: 'Motorcycle model', example: 'R1250GS Adventure' },
      { name: 'city', description: 'Rider city', example: 'Oakland' },
      { name: 'state', description: 'Rider state', example: 'CA' },
    ],
    sampleData: {
      fullName: 'John Smith',
      nickname: 'Johnny',
      bikeYear: '2023',
      bikeModel: 'R1250GS Adventure',
      city: 'Oakland',
      state: 'CA',
    }
  },
  {
    id: 'announcement',
    name: 'Announcement Email',
    description: 'Sent when admin creates a new announcement',
    subject: '{{title}} - BMW Baja Tour 2026',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <p style="color: #bfdbfe; font-size: 14px; margin: 0 0 5px 0;">
                BMW Baja Tour 2026
              </p>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">
                {{title}}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px;">
              <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                {{content}}
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="https://bajarun.ncmotoadv.com" style="display: inline-block; background-color: #1e40af; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
                  View on Website
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                NorCal Moto Adventures
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    variables: [
      { name: 'title', description: 'Announcement title', example: 'Important Update' },
      { name: 'content', description: 'Announcement content (HTML supported)', example: '<p>This is the announcement content.</p>' },
    ],
    sampleData: {
      title: 'Important Update',
      content: '<p>This is a sample announcement with some <strong>important information</strong> about the tour.</p><p>Please review and let us know if you have questions.</p>',
    }
  }
];

export default function EmailTemplatesPage() {
  const { user, loading: authLoading } = useAuth();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateId, setNewTemplateId] = useState('');

  // Load templates
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.uid !== ADMIN_UID) {
      setLoading(false);
      return;
    }

    const loadTemplates = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'emailTemplates'));
        const loadedTemplates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EmailTemplate[];

        setTemplates(loadedTemplates);
        if (loadedTemplates.length > 0) {
          setSelectedTemplate(loadedTemplates[0]);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setMessage({ type: 'error', text: 'Failed to load templates' });
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [user, authLoading]);

  // Seed default templates
  const seedDefaultTemplates = async () => {
    setSaving(true);
    try {
      for (const template of DEFAULT_TEMPLATES) {
        await setDoc(doc(db, 'emailTemplates', template.id), {
          ...template,
          lastUpdated: serverTimestamp(),
          updatedBy: user?.email || 'admin'
        });
      }

      // Reload templates
      const snapshot = await getDocs(collection(db, 'emailTemplates'));
      const loadedTemplates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailTemplate[];

      setTemplates(loadedTemplates);
      if (loadedTemplates.length > 0) {
        setSelectedTemplate(loadedTemplates[0]);
      }

      setMessage({ type: 'success', text: 'Default templates created successfully' });
    } catch (error) {
      console.error('Error seeding templates:', error);
      setMessage({ type: 'error', text: 'Failed to create default templates' });
    } finally {
      setSaving(false);
    }
  };

  // Save template
  const saveTemplate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'emailTemplates', selectedTemplate.id), {
        ...selectedTemplate,
        lastUpdated: serverTimestamp(),
        updatedBy: user?.email || 'admin'
      });

      // Update local state
      setTemplates(prev => prev.map(t =>
        t.id === selectedTemplate.id ? selectedTemplate : t
      ));

      setMessage({ type: 'success', text: 'Template saved successfully' });
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage({ type: 'error', text: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  // Create new template
  const createTemplate = async () => {
    if (!newTemplateId.trim()) return;

    const id = newTemplateId.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Check if exists
    const existingDoc = await getDoc(doc(db, 'emailTemplates', id));
    if (existingDoc.exists()) {
      setMessage({ type: 'error', text: 'Template with this ID already exists' });
      return;
    }

    const newTemplate: EmailTemplate = {
      id,
      name: newTemplateId,
      description: 'New email template',
      subject: 'Subject - BMW Baja Tour 2026',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
  <h1>Hello {{name}}!</h1>
  <p>Your content here...</p>
</body>
</html>`,
      variables: [
        { name: 'name', description: 'Recipient name', example: 'John' }
      ],
      sampleData: { name: 'John' }
    };

    setSaving(true);
    try {
      await setDoc(doc(db, 'emailTemplates', id), {
        ...newTemplate,
        lastUpdated: serverTimestamp(),
        updatedBy: user?.email || 'admin'
      });

      setTemplates(prev => [...prev, newTemplate]);
      setSelectedTemplate(newTemplate);
      setIsCreating(false);
      setNewTemplateId('');
      setMessage({ type: 'success', text: 'Template created successfully' });
    } catch (error) {
      console.error('Error creating template:', error);
      setMessage({ type: 'error', text: 'Failed to create template' });
    } finally {
      setSaving(false);
    }
  };

  // Delete template
  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setSaving(true);
    try {
      await deleteDoc(doc(db, 'emailTemplates', templateId));

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(templates.find(t => t.id !== templateId) || null);
      }

      setMessage({ type: 'success', text: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting template:', error);
      setMessage({ type: 'error', text: 'Failed to delete template' });
    } finally {
      setSaving(false);
    }
  };

  // Replace variables with sample data for preview
  const getPreviewHtml = () => {
    if (!selectedTemplate) return '';

    let html = selectedTemplate.body;
    for (const [key, value] of Object.entries(selectedTemplate.sampleData)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return html;
  };

  // Update template field
  const updateTemplate = (field: keyof EmailTemplate, value: any) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({ ...selectedTemplate, [field]: value });
  };

  // Update sample data
  const updateSampleData = (key: string, value: string) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({
      ...selectedTemplate,
      sampleData: { ...selectedTemplate.sampleData, [key]: value }
    });
  };

  // Add variable
  const addVariable = () => {
    if (!selectedTemplate) return;
    const newVar: TemplateVariable = {
      name: 'newVariable',
      description: 'Description',
      example: 'Example value'
    };
    setSelectedTemplate({
      ...selectedTemplate,
      variables: [...selectedTemplate.variables, newVar],
      sampleData: { ...selectedTemplate.sampleData, newVariable: 'Example value' }
    });
  };

  // Remove variable
  const removeVariable = (index: number) => {
    if (!selectedTemplate) return;
    const varName = selectedTemplate.variables[index].name;
    const newVars = selectedTemplate.variables.filter((_, i) => i !== index);
    const newSampleData = { ...selectedTemplate.sampleData };
    delete newSampleData[varName];
    setSelectedTemplate({
      ...selectedTemplate,
      variables: newVars,
      sampleData: newSampleData
    });
  };

  // Update variable
  const updateVariable = (index: number, field: keyof TemplateVariable, value: string) => {
    if (!selectedTemplate) return;
    const oldName = selectedTemplate.variables[index].name;
    const newVars = [...selectedTemplate.variables];
    newVars[index] = { ...newVars[index], [field]: value };

    let newSampleData = { ...selectedTemplate.sampleData };
    if (field === 'name' && oldName !== value) {
      // Rename key in sample data
      newSampleData[value] = newSampleData[oldName] || '';
      delete newSampleData[oldName];
    }

    setSelectedTemplate({
      ...selectedTemplate,
      variables: newVars,
      sampleData: newSampleData
    });
  };

  // Copy variable syntax to clipboard
  const copyVariable = (name: string) => {
    navigator.clipboard.writeText(`{{${name}}}`);
    setMessage({ type: 'success', text: `Copied {{${name}}} to clipboard` });
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Email Templates">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Email Templates">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-slate-400 text-sm">
          Manage email templates with Handlebars syntax
        </p>
        {templates.length === 0 && (
            <button
              onClick={seedDefaultTemplates}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Load Default Templates
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <span className={message.type === 'success' ? 'text-green-300' : 'text-red-300'}>
              {message.text}
            </span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {templates.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <Mail className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Templates Yet</h2>
            <p className="text-slate-400 mb-6">
              Click "Load Default Templates" to create the welcome and announcement email templates.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Template List */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <h2 className="font-semibold text-white">Templates</h2>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="New template"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {isCreating && (
                  <div className="p-3 border-b border-slate-700 bg-slate-900/50">
                    <input
                      type="text"
                      value={newTemplateId}
                      onChange={(e) => setNewTemplateId(e.target.value)}
                      placeholder="Template ID (e.g., reminder)"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm mb-2"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={createTemplate}
                        disabled={!newTemplateId.trim() || saving}
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-sm rounded transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => { setIsCreating(false); setNewTemplateId(''); }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-700">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full p-4 text-left transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'bg-blue-600/20 border-l-2 border-blue-500'
                          : 'hover:bg-slate-700/50 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className={`h-5 w-5 mt-0.5 ${
                          selectedTemplate?.id === template.id ? 'text-blue-400' : 'text-slate-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{template.name}</p>
                          <p className="text-slate-400 text-xs truncate">{template.id}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Editor */}
            <div className="lg:col-span-3">
              {selectedTemplate ? (
                <div className="space-y-6">
                  {/* Editor Header */}
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={selectedTemplate.name}
                          onChange={(e) => updateTemplate('name', e.target.value)}
                          className="text-xl font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                        />
                        <input
                          type="text"
                          value={selectedTemplate.description}
                          onChange={(e) => updateTemplate('description', e.target.value)}
                          className="text-slate-400 text-sm bg-transparent border-none focus:outline-none focus:ring-0 w-full mt-1"
                          placeholder="Template description"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            showPreview
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {showPreview ? 'Hide Preview' : 'Preview'}
                        </button>
                        <button
                          onClick={() => deleteTemplate(selectedTemplate.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={saveTemplate}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Subject Line</label>
                      <input
                        type="text"
                        value={selectedTemplate.subject}
                        onChange={(e) => updateTemplate('subject', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* HTML Body Editor */}
                    <div className={showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}>
                      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="p-3 border-b border-slate-700 flex items-center gap-2">
                          <Code className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-white">HTML Body</span>
                        </div>
                        <textarea
                          value={selectedTemplate.body}
                          onChange={(e) => updateTemplate('body', e.target.value)}
                          className="w-full h-96 p-4 bg-slate-900 text-slate-300 font-mono text-sm focus:outline-none resize-none"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {showPreview && (
                      <div className="lg:col-span-1">
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden sticky top-24">
                          <div className="p-3 border-b border-slate-700 flex items-center gap-2">
                            <Eye className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium text-white">Preview</span>
                          </div>
                          <div className="bg-white h-96 overflow-auto">
                            <iframe
                              srcDoc={getPreviewHtml()}
                              className="w-full h-full border-none"
                              title="Email Preview"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Variables */}
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-white">Template Variables</span>
                      </div>
                      <button
                        onClick={addVariable}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add Variable
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                              <th className="pb-3 pr-4">Variable Name</th>
                              <th className="pb-3 pr-4">Description</th>
                              <th className="pb-3 pr-4">Sample Value</th>
                              <th className="pb-3 w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {selectedTemplate.variables.map((variable, index) => (
                              <tr key={index}>
                                <td className="py-3 pr-4">
                                  <input
                                    type="text"
                                    value={variable.name}
                                    onChange={(e) => updateVariable(index, 'name', e.target.value)}
                                    className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm w-full"
                                  />
                                </td>
                                <td className="py-3 pr-4">
                                  <input
                                    type="text"
                                    value={variable.description}
                                    onChange={(e) => updateVariable(index, 'description', e.target.value)}
                                    className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-300 text-sm w-full"
                                  />
                                </td>
                                <td className="py-3 pr-4">
                                  <input
                                    type="text"
                                    value={selectedTemplate.sampleData[variable.name] || ''}
                                    onChange={(e) => updateSampleData(variable.name, e.target.value)}
                                    className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-300 text-sm w-full"
                                  />
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => copyVariable(variable.name)}
                                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                                      title="Copy variable syntax"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => removeVariable(index)}
                                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                                      title="Remove variable"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p className="text-xs text-slate-500 mt-4">
                        Use <code className="bg-slate-900 px-1 py-0.5 rounded">{'{{variableName}}'}</code> in your template to insert dynamic content.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
                  <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select a template to edit</p>
                </div>
              )}
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
