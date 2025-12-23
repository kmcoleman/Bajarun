/**
 * RiderDocumentsPage.tsx
 *
 * Page for riders to upload and manage important travel documents:
 * - Driver's License
 * - Passport
 * - Mexico Insurance Policy
 * - American Insurance Card
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  FileText,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  Trash2,
  CreditCard,
  BookOpen,
  Shield,
  Car
} from 'lucide-react';

interface DocumentInfo {
  url: string;
  fileName: string;
  uploadedAt: Date;
}

interface RiderDocuments {
  driversLicense?: DocumentInfo;
  passport?: DocumentInfo;
  fmmCard?: DocumentInfo;
  fmmPaymentReceipt?: DocumentInfo;
  mexicoInsurance?: DocumentInfo;
  americanInsurance?: DocumentInfo;
}

type DocumentType = 'driversLicense' | 'passport' | 'fmmCard' | 'fmmPaymentReceipt' | 'mexicoInsurance' | 'americanInsurance';

const documentConfig: Record<DocumentType, { label: string; icon: React.ElementType; accept: string; description: string }> = {
  driversLicense: {
    label: "Driver's License",
    icon: CreditCard,
    accept: 'image/*',
    description: 'Upload a clear photo of your driver\'s license (front)'
  },
  passport: {
    label: 'Passport',
    icon: BookOpen,
    accept: 'image/*',
    description: 'Upload a clear photo of your passport photo page'
  },
  fmmCard: {
    label: 'FMM Card',
    icon: FileText,
    accept: 'application/pdf,image/*',
    description: 'Upload your completed FMM (Forma Migratoria Múltiple) document'
  },
  fmmPaymentReceipt: {
    label: 'FMM Payment Receipt',
    icon: FileText,
    accept: 'application/pdf,image/*',
    description: 'Upload your FMM payment confirmation receipt'
  },
  mexicoInsurance: {
    label: 'Mexico Insurance Policy',
    icon: Shield,
    accept: 'application/pdf,image/*',
    description: 'Upload your Mexico motorcycle insurance policy (PDF or image)'
  },
  americanInsurance: {
    label: 'American Insurance Card',
    icon: Car,
    accept: 'application/pdf,image/*',
    description: 'Upload your US motorcycle insurance card (PDF or image)'
  }
};

export default function RiderDocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<RiderDocuments>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRefs = {
    driversLicense: useRef<HTMLInputElement>(null),
    passport: useRef<HTMLInputElement>(null),
    fmmCard: useRef<HTMLInputElement>(null),
    fmmPaymentReceipt: useRef<HTMLInputElement>(null),
    mexicoInsurance: useRef<HTMLInputElement>(null),
    americanInsurance: useRef<HTMLInputElement>(null)
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Load existing documents
  useEffect(() => {
    async function loadDocuments() {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.riderDocuments) {
            setDocuments(data.riderDocuments);
          }
        }
      } catch (err) {
        console.error('Error loading documents:', err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDocuments();
    }
  }, [user]);

  // Handle file upload
  const handleFileUpload = async (docType: DocumentType, file: File) => {
    if (!user) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(docType);
    setError(null);

    try {
      // Create storage reference
      const fileExtension = file.name.split('.').pop();
      const fileName = `${docType}-${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `rider-documents/${user.uid}/${fileName}`);

      // Upload file
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // Create document info
      const docInfo: DocumentInfo = {
        url: downloadUrl,
        fileName: file.name,
        uploadedAt: new Date()
      };

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      const updatedDocuments = {
        ...documents,
        [docType]: docInfo
      };

      await setDoc(userRef, {
        riderDocuments: updatedDocuments,
        documentsUpdatedAt: new Date()
      }, { merge: true });

      // Update local state
      setDocuments(updatedDocuments);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  // Handle file input change
  const handleFileChange = (docType: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(docType, file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle document deletion
  const handleDeleteDocument = async (docType: DocumentType) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete your ${documentConfig[docType].label}?`)) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedDocuments = { ...documents };
      delete updatedDocuments[docType];

      await setDoc(userRef, {
        riderDocuments: updatedDocuments,
        documentsUpdatedAt: new Date()
      }, { merge: true });

      setDocuments(updatedDocuments);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Rider Documents</h1>
          <p className="text-slate-400">
            Upload your important travel documents for the Baja Tour. These documents will be securely stored and accessible by trip organizers in case of emergency.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-600/10 border border-red-500/30 rounded-lg text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Document Upload Cards */}
        <div className="space-y-4">
          {(Object.keys(documentConfig) as DocumentType[]).map((docType) => {
            const config = documentConfig[docType];
            const docInfo = documents[docType];
            const Icon = config.icon;
            const isUploading = uploading === docType;

            return (
              <div
                key={docType}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    docInfo ? 'bg-green-600/20' : 'bg-slate-700'
                  }`}>
                    {docInfo ? (
                      <Check className="h-6 w-6 text-green-400" />
                    ) : (
                      <Icon className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {config.label}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {config.description}
                    </p>

                    {docInfo ? (
                      /* Document Uploaded */
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-300 truncate max-w-[200px]">
                            {docInfo.fileName}
                          </span>
                        </div>

                        <a
                          href={docInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </a>

                        <button
                          onClick={() => fileInputRefs[docType].current?.click()}
                          disabled={isUploading}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          Replace
                        </button>

                        <button
                          onClick={() => handleDeleteDocument(docType)}
                          className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-600/10 text-sm rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    ) : (
                      /* No Document */
                      <button
                        onClick={() => fileInputRefs[docType].current?.click()}
                        disabled={isUploading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isUploading
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload {config.label}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRefs[docType]}
                  type="file"
                  accept={config.accept}
                  onChange={(e) => handleFileChange(docType, e)}
                  className="hidden"
                />
              </div>
            );
          })}
        </div>

        {/* Info Note */}
        <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <h4 className="text-white font-medium mb-2">Why we need these documents</h4>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>- <strong>Driver's License:</strong> Required for border crossing and emergencies</li>
            <li>- <strong>Passport:</strong> Essential for entry into Mexico</li>
            <li>- <strong>FMM Card:</strong> Required tourist permit for Mexico (complete online within 30 days of entry)</li>
            <li>- <strong>FMM Payment Receipt:</strong> Proof of payment - border agents may ask for it</li>
            <li>- <strong>Mexico Insurance:</strong> Legally required to ride in Mexico</li>
            <li>- <strong>American Insurance:</strong> For coverage before/after Mexico</li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            All documents are stored securely and only accessible to trip organizers.
          </p>
        </div>
      </div>
    </div>
  );
}
