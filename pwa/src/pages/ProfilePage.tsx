/**
 * Profile page - User's registration info and documents.
 */

import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useOfflineData } from '../hooks/useOfflineData';
import {
  documentConfig,
  DocumentType,
  cacheDocument,
  getCachedDocument,
  isDocumentCached,
  viewCachedDocument,
  removeCachedDocument,
} from '../lib/documents';

// Admin UID - must match the one in Cloud Functions
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;
  const { userProfile, riderDocuments, loading, syncing, refresh } = useOfflineData(user?.uid || null);
  const [cachedDocs, setCachedDocs] = useState<Set<DocumentType>>(new Set());
  const [downloading, setDownloading] = useState<DocumentType | null>(null);

  // Check which documents are cached
  useEffect(() => {
    async function checkCached() {
      const cached = new Set<DocumentType>();
      const docTypes: DocumentType[] = ['driversLicense', 'passport', 'fmmCard', 'fmmPaymentReceipt', 'mexicoInsurance', 'americanInsurance'];
      for (const docType of docTypes) {
        if (await isDocumentCached(docType)) {
          cached.add(docType);
        }
      }
      setCachedDocs(cached);
    }
    checkCached();
  }, [riderDocuments]);

  // Download and cache a document
  const handleDownload = async (docType: DocumentType) => {
    const docInfo = riderDocuments?.[docType];
    if (!docInfo) return;

    setDownloading(docType);
    try {
      await cacheDocument(docType, docInfo);
      setCachedDocs(prev => new Set([...prev, docType]));
    } catch (error) {
      console.error('Failed to cache document:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // View a cached document
  const handleView = async (docType: DocumentType) => {
    const cached = await getCachedDocument(docType);
    if (cached) {
      viewCachedDocument(cached);
    }
  };

  // Remove cached document
  const handleRemove = async (docType: DocumentType) => {
    await removeCachedDocument(docType);
    setCachedDocs(prev => {
      const next = new Set(prev);
      next.delete(docType);
      return next;
    });
  };

  const handleRefresh = async () => {
    await refresh();
  };

  return (
    <Layout title="Profile" currentPath="/profile">
      <div className="p-4 space-y-4">
        {/* User Info */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-4">
            {userProfile?.odPhotoUrl || user?.photoURL ? (
              <img
                src={userProfile?.odPhotoUrl || user?.photoURL || ''}
                alt={userProfile?.odFirstName || user?.displayName || 'Profile'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                👤
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {userProfile
                  ? `${userProfile.odFirstName} ${userProfile.odLastName}`
                  : user?.displayName || 'Rider'}
              </h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={syncing}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {syncing ? '...' : '↻'}
            </button>
          </div>
        </section>

        {/* Registration Info */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-baja-dark text-white px-4 py-2 text-sm font-medium">
            My Registration
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-gray-500 text-sm">Loading...</div>
            ) : userProfile ? (
              <>
                {userProfile.odNickname && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Nickname:</span>
                    <span className="text-gray-900 text-sm font-medium">
                      {userProfile.odNickname}
                    </span>
                  </div>
                )}
                {userProfile.odPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Phone:</span>
                    <a
                      href={`tel:${userProfile.odPhone}`}
                      className="text-blue-600 text-sm font-medium"
                    >
                      {userProfile.odPhone}
                    </a>
                  </div>
                )}
                {userProfile.odBike && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Motorcycle:</span>
                    <span className="text-gray-900 text-sm font-medium">
                      {userProfile.odBike}
                    </span>
                  </div>
                )}
                {userProfile.odSkills && userProfile.odSkills.length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm block mb-2">Skills:</span>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.odSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 text-sm">
                Registration info not available. Complete your registration on the main
                website.
              </div>
            )}
          </div>
        </section>

        {/* Emergency Contact */}
        {userProfile?.odEmergencyContactName && (
          <section className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-2 text-sm font-medium">
              Emergency Contact
            </div>
            <div className="p-4 space-y-2">
              <div className="font-medium text-gray-900">
                {userProfile.odEmergencyContactName}
              </div>
              {userProfile.odEmergencyContactPhone && (
                <a
                  href={`tel:${userProfile.odEmergencyContactPhone}`}
                  className="text-blue-600 text-sm flex items-center gap-2"
                >
                  📞 {userProfile.odEmergencyContactPhone}
                </a>
              )}
            </div>
          </section>
        )}

        {/* Documents */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-600 text-white px-4 py-2 text-sm font-medium">
            My Documents
          </div>
          <div className="p-4">
            {!riderDocuments || Object.keys(riderDocuments).length === 0 ? (
              <p className="text-gray-500 text-sm text-center">
                No documents uploaded. Upload documents on the main website.
              </p>
            ) : (
              <div className="space-y-3">
                {(Object.keys(documentConfig) as DocumentType[]).map((docType) => {
                  const docInfo = riderDocuments[docType];
                  const config = documentConfig[docType];
                  const isCached = cachedDocs.has(docType);
                  const isDownloading = downloading === docType;

                  if (!docInfo) return null;

                  return (
                    <div
                      key={docType}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl">{config.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {config.label}
                          </div>
                          {isCached && (
                            <div className="text-xs text-green-600">Cached for offline</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isCached ? (
                          <>
                            <button
                              onClick={() => handleView(docType)}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleRemove(docType)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDownload(docType)}
                            disabled={isDownloading}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium disabled:opacity-50"
                          >
                            {isDownloading ? 'Downloading...' : 'Download'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3 text-center">
              Download documents for offline viewing during the tour
            </p>
          </div>
        </section>

        {/* Admin Section */}
        {isAdmin && (
          <section className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-purple-600 text-white px-4 py-2 text-sm font-medium">
              Admin
            </div>
            <div className="p-4">
              <button
                onClick={() => route('/admin')}
                className="w-full py-3 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
              >
                Send Push Notification
              </button>
            </div>
          </section>
        )}

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="w-full bg-red-50 text-red-600 font-medium py-3 rounded-xl hover:bg-red-100 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </Layout>
  );
}
