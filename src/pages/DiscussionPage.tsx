/**
 * DiscussionPage.tsx
 *
 * Forum/discussion board for trip participants.
 * Only registered participants can view and post.
 * Stores posts in Firestore discussionPosts collection.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  LogIn,
  Heart,
  Reply,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Admin UID for organizer badge
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface DiscussionReply {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string | null;
  content: string;
  createdAt: Timestamp;
}

interface DiscussionPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string | null;
  content: string;
  createdAt: Timestamp;
  likes: string[]; // Array of UIDs who liked
  replies: DiscussionReply[];
}

export default function DiscussionPage() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // State
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationName, setRegistrationName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Check if user has a registration
  useEffect(() => {
    async function checkRegistration() {
      if (!user) {
        setCheckingRegistration(false);
        setIsRegistered(false);
        return;
      }

      try {
        const registrationsRef = collection(db, 'registrations');
        const q = query(registrationsRef, where('uid', '==', user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setIsRegistered(true);
          setRegistrationName(data.fullName || user.displayName || 'Rider');
        } else {
          setIsRegistered(false);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
        setIsRegistered(false);
      } finally {
        setCheckingRegistration(false);
      }
    }

    checkRegistration();
  }, [user]);

  // Fetch posts from Firestore (only if registered)
  useEffect(() => {
    if (!isRegistered || checkingRegistration) {
      setLoading(false);
      return;
    }

    const postsRef = collection(db, 'discussionPosts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsData: DiscussionPost[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as DiscussionPost[];
        setPosts(postsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching posts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isRegistered, checkingRegistration]);

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !user || !isRegistered) return;

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'discussionPosts'), {
        authorUid: user.uid,
        authorName: registrationName,
        authorPhoto: user.photoURL || null,
        content: newPost.trim(),
        createdAt: serverTimestamp(),
        likes: [],
        replies: []
      });
      setNewPost('');
    } catch (error) {
      console.error('Error posting:', error);
      alert('Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: string[]) => {
    if (!user) return;

    const postRef = doc(db, 'discussionPosts', postId);
    const hasLiked = currentLikes.includes(user.uid);

    try {
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleSubmitReply = async (postId: string) => {
    if (!replyContent.trim() || !user || !isRegistered) return;

    const postRef = doc(db, 'discussionPosts', postId);

    try {
      const newReply: DiscussionReply = {
        id: `${Date.now()}-${user.uid}`,
        authorUid: user.uid,
        authorName: registrationName,
        authorPhoto: user.photoURL || null,
        content: replyContent.trim(),
        createdAt: Timestamp.now()
      };

      await updateDoc(postRef, {
        replies: arrayUnion(newReply)
      });

      setReplyContent('');
      setReplyingTo(null);
      // Auto-expand replies after posting
      setExpandedReplies((prev) => new Set(prev).add(postId));
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
    }
  };

  const toggleReplies = (postId: string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Sign In Required</h1>
            <p className="text-slate-400 mb-6">
              Please sign in to view the discussion forum.
            </p>
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Checking registration status
  if (checkingRegistration) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Checking registration...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not registered
  if (!isRegistered) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Registration Required</h1>
            <p className="text-slate-400 mb-6">
              The discussion forum is only available to registered participants.
              Please complete your registration to join the conversation.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Register for the Tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading posts
  if (loading) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading discussion...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Discussion</h1>
          <p className="text-slate-400">
            Connect with fellow riders, ask questions, and share tips for the trip.
          </p>
        </div>

        {/* New Post Form */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <form onSubmit={handleSubmitPost}>
            <div className="flex items-start gap-4">
              <img
                src={user.photoURL || '/default-avatar.png'}
                alt={registrationName}
                className="w-10 h-10 rounded-full border-2 border-blue-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                }}
              />
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share something with the group..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-slate-500">Posting as {registrationName}</span>
                  <button
                    type="submit"
                    disabled={!newPost.trim() || submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {posts.map((post) => {
            const isOrganizer = post.authorUid === ADMIN_UID;
            const hasLiked = user ? post.likes?.includes(user.uid) : false;
            const repliesExpanded = expandedReplies.has(post.id);

            return (
              <div
                key={post.id}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
              >
                {/* Post Content */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {post.authorPhoto ? (
                        <img
                          src={post.authorPhoto}
                          alt={post.authorName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full bg-blue-600/20 flex items-center justify-center"><svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-600/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-white font-medium">{post.authorName}</span>
                        {isOrganizer && (
                          <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                            Organizer
                          </span>
                        )}
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-4">
                        <button
                          onClick={() => handleLike(post.id, post.likes || [])}
                          className={`flex items-center gap-1 transition-colors ${
                            hasLiked
                              ? 'text-red-400'
                              : 'text-slate-400 hover:text-red-400'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                          <span className="text-sm">{post.likes?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(replyingTo === post.id ? null : post.id);
                            setReplyContent('');
                          }}
                          className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Reply className="h-4 w-4" />
                          <span className="text-sm">Reply</span>
                        </button>
                        {post.replies?.length > 0 && (
                          <button
                            onClick={() => toggleReplies(post.id)}
                            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                          >
                            {repliesExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="text-sm">
                              {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Reply Form */}
                      {replyingTo === post.id && (
                        <div className="mt-4 flex gap-3">
                          <img
                            src={user.photoURL || '/default-avatar.png'}
                            alt={registrationName}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-avatar.png';
                            }}
                          />
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              rows={2}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                className="px-3 py-1.5 text-slate-400 hover:text-white text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSubmitReply(post.id)}
                                disabled={!replyContent.trim()}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-sm"
                              >
                                <Send className="h-3 w-3" />
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {post.replies?.length > 0 && repliesExpanded && (
                  <div className="bg-slate-900/50 border-t border-slate-700">
                    {post.replies.map((reply) => {
                      const replyIsOrganizer = reply.authorUid === ADMIN_UID;
                      return (
                        <div
                          key={reply.id}
                          className="px-6 py-4 border-b border-slate-700/50 last:border-0"
                        >
                          <div className="flex items-start gap-4 ml-14">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              {reply.authorPhoto ? (
                                <img
                                  src={reply.authorPhoto}
                                  alt={reply.authorName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                  <User className="h-4 w-4 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-white font-medium text-sm">
                                  {reply.authorName}
                                </span>
                                {replyIsOrganizer && (
                                  <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                                    Organizer
                                  </span>
                                )}
                                <span className="text-slate-500 text-xs">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-slate-400 text-sm whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-slate-400">Be the first to start a discussion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
