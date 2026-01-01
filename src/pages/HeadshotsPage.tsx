/**
 * HeadshotsPage.tsx
 *
 * Admin page to view all registered users and their headshot status.
 * Shows photo if available, or indicates missing.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Loader2, User, Camera, CheckCircle, XCircle, RefreshCw, Image, FolderOpen } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';

const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface Registration {
  id: string;
  fullName: string;
  email: string;
  headshotUrl?: string;
  uid?: string;
}

interface GalleryFile {
  name: string;
  fullPath: string;
  downloadUrl: string;
  contentType?: string;
  size?: number;
  timeCreated?: string;
}

export default function HeadshotsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'with' | 'without'>('all');
  const [activeTab, setActiveTab] = useState<'headshots' | 'storage' | 'orphaned'>('headshots');
  const [galleryFiles, setGalleryFiles] = useState<GalleryFile[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const isAdmin = user?.uid === ADMIN_UID;

  useEffect(() => {
    if (isAdmin) {
      loadRegistrations();
    }
  }, [isAdmin]);

  const loadGalleryFiles = async () => {
    setGalleryLoading(true);
    try {
      const galleryRef = ref(storage, 'headshots');
      const result = await listAll(galleryRef);

      const files: GalleryFile[] = [];

      for (const itemRef of result.items) {
        try {
          const [url, metadata] = await Promise.all([
            getDownloadURL(itemRef),
            getMetadata(itemRef),
          ]);

          files.push({
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            downloadUrl: url,
            contentType: metadata.contentType,
            size: metadata.size,
            timeCreated: metadata.timeCreated,
          });
        } catch (err) {
          console.error('Error getting file info:', itemRef.name, err);
        }
      }

      // Sort by creation time, newest first
      files.sort((a, b) => {
        if (a.timeCreated && b.timeCreated) {
          return new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime();
        }
        return 0;
      });

      setGalleryFiles(files);
    } catch (error) {
      console.error('Error loading gallery files:', error);
    } finally {
      setGalleryLoading(false);
    }
  };

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'registrations'));
      const regs: Registration[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        regs.push({
          id: doc.id,
          fullName: data.fullName || 'Unknown',
          email: data.email || '',
          headshotUrl: data.headshotUrl || undefined,
          uid: data.uid,
        });
      });

      // Sort by name
      regs.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setRegistrations(regs);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Please log in to access this page.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Access denied. Admin only.</p>
      </div>
    );
  }

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === 'with') return !!reg.headshotUrl;
    if (filter === 'without') return !reg.headshotUrl;
    return true;
  });

  const withHeadshot = registrations.filter((r) => r.headshotUrl).length;
  const withoutHeadshot = registrations.filter((r) => !r.headshotUrl).length;

  // Find orphaned photos (in storage but not linked to any registration)
  const orphanedPhotos = galleryFiles.filter(file => {
    // Check if this storage file URL is used by any registration
    return !registrations.some(reg => reg.headshotUrl?.includes(file.name));
  });
  const linkedPhotos = galleryFiles.filter(file => {
    return registrations.some(reg => reg.headshotUrl?.includes(file.name));
  });

  return (
    <AdminLayout title="Media Manager">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-400" />
              Media Manager
            </h1>
            <p className="text-slate-400 mt-1">
              View user headshots and gallery files
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 pb-4">
          <button
            onClick={() => setActiveTab('headshots')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'headshots'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <User className="w-4 h-4" />
            User Headshots
          </button>
          <button
            onClick={() => {
              setActiveTab('storage');
              if (galleryFiles.length === 0) {
                loadGalleryFiles();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'storage'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            All Storage Photos
          </button>
          <button
            onClick={() => {
              setActiveTab('orphaned');
              if (galleryFiles.length === 0) {
                loadGalleryFiles();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'orphaned'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Orphaned Photos
          </button>
        </div>

        {/* HEADSHOTS TAB */}
        {activeTab === 'headshots' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-white">{registrations.length}</div>
                <div className="text-slate-400 text-sm">Total Registrations</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-green-500/30">
                <div className="text-3xl font-bold text-green-400">{withHeadshot}</div>
                <div className="text-slate-400 text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  With Headshot
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-red-500/30">
                <div className="text-3xl font-bold text-red-400">{withoutHeadshot}</div>
                <div className="text-slate-400 text-sm flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-400" />
                  Missing Headshot
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All ({registrations.length})
              </button>
              <button
                onClick={() => setFilter('with')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'with'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                With Photo ({withHeadshot})
              </button>
              <button
                onClick={() => setFilter('without')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'without'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Missing Photo ({withoutHeadshot})
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            )}

            {/* User Grid */}
            {!loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className={`bg-slate-800 rounded-xl p-4 border ${
                      reg.headshotUrl ? 'border-slate-700' : 'border-red-500/30'
                    }`}
                  >
                    {/* Photo */}
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-700 mb-3">
                      {reg.headshotUrl ? (
                        <img
                          src={reg.headshotUrl}
                          alt={reg.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          reg.headshotUrl ? 'hidden' : ''
                        }`}
                      >
                        <User className="w-16 h-16 text-slate-500" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <h3 className="text-white font-medium truncate">{reg.fullName}</h3>
                      <p className="text-slate-400 text-sm truncate">{reg.email}</p>
                      <div className="mt-2">
                        {reg.headshotUrl ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Has Photo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
                            <XCircle className="w-3 h-3" />
                            No Photo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredRegistrations.length === 0 && (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No registrations found matching the filter.</p>
              </div>
            )}
          </>
        )}

        {/* STORAGE TAB - All photos in storage */}
        {activeTab === 'storage' && (
          <>
            {/* Gallery Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-white">{galleryFiles.length}</div>
                <div className="text-slate-400 text-sm">Total Files</div>
              </div>
              <button
                onClick={loadGalleryFiles}
                disabled={galleryLoading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${galleryLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Gallery Loading */}
            {galleryLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            )}

            {/* Gallery Grid */}
            {!galleryLoading && galleryFiles.length > 0 && (
              <div className="space-y-4">
                {galleryFiles.map((file, index) => (
                  <div
                    key={index}
                    className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700">
                        {file.contentType?.startsWith('image/') ? (
                          <img
                            src={file.downloadUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : file.contentType?.startsWith('video/') ? (
                          <video
                            src={file.downloadUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-12 h-12 text-slate-500" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate mb-2">{file.name}</h3>

                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-slate-500">Path: </span>
                            <span className="text-slate-300 font-mono text-xs">{file.fullPath}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Type: </span>
                            <span className="text-slate-300">{file.contentType || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Size: </span>
                            <span className="text-slate-300">
                              {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Created: </span>
                            <span className="text-slate-300">
                              {file.timeCreated ? new Date(file.timeCreated).toLocaleString() : 'Unknown'}
                            </span>
                          </div>
                          <div className="pt-2">
                            <span className="text-slate-500">URL: </span>
                            <input
                              type="text"
                              readOnly
                              value={file.downloadUrl}
                              className="w-full mt-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-slate-400 font-mono"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Storage Empty State */}
            {!galleryLoading && galleryFiles.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No files found in headshots/</p>
              </div>
            )}
          </>
        )}

        {/* ORPHANED TAB - Photos not linked to any registration */}
        {activeTab === 'orphaned' && (
          <>
            {/* Orphaned Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="text-3xl font-bold text-white">{galleryFiles.length}</div>
                  <div className="text-slate-400 text-sm">Total in Storage</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-green-500/30">
                  <div className="text-3xl font-bold text-green-400">{linkedPhotos.length}</div>
                  <div className="text-slate-400 text-sm">Linked to Users</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-orange-500/30">
                  <div className="text-3xl font-bold text-orange-400">{orphanedPhotos.length}</div>
                  <div className="text-slate-400 text-sm">Orphaned</div>
                </div>
              </div>
              <button
                onClick={loadGalleryFiles}
                disabled={galleryLoading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${galleryLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Orphaned Loading */}
            {galleryLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            )}

            {/* Orphaned Grid */}
            {!galleryLoading && orphanedPhotos.length > 0 && (
              <div className="space-y-4">
                <p className="text-orange-400 text-sm mb-4">
                  These photos exist in storage but are NOT linked to any registration:
                </p>
                {orphanedPhotos.map((file, index) => (
                  <div
                    key={index}
                    className="bg-slate-800 rounded-xl p-4 border border-orange-500/30"
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700">
                        {file.contentType?.startsWith('image/') ? (
                          <img
                            src={file.downloadUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-12 h-12 text-slate-500" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-medium truncate">{file.name}</h3>
                          <span className="inline-flex items-center gap-1 text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Orphaned
                          </span>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-slate-500">Path: </span>
                            <span className="text-slate-300 font-mono text-xs">{file.fullPath}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Size: </span>
                            <span className="text-slate-300">
                              {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Created: </span>
                            <span className="text-slate-300">
                              {file.timeCreated ? new Date(file.timeCreated).toLocaleString() : 'Unknown'}
                            </span>
                          </div>
                          <div className="pt-2">
                            <span className="text-slate-500">URL: </span>
                            <input
                              type="text"
                              readOnly
                              value={file.downloadUrl}
                              className="w-full mt-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-slate-400 font-mono"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Orphaned Empty State */}
            {!galleryLoading && orphanedPhotos.length === 0 && galleryFiles.length > 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-green-400">All photos in storage are linked to registrations!</p>
              </div>
            )}

            {/* No files loaded yet */}
            {!galleryLoading && galleryFiles.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No files found in headshots/</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
