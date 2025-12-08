/**
 * DiscussionPage.tsx
 *
 * Forum/discussion board for trip participants.
 * Requires authentication to post.
 * Stores posts in Firestore (when Firebase is configured).
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  LogIn,
  Heart,
  Reply
} from 'lucide-react';

// Sample discussion data (will be replaced with Firestore)
const samplePosts = [
  {
    id: '1',
    author: {
      name: 'Kevin Coleman',
      avatar: null,
      isOrganizer: true
    },
    content: "Welcome everyone! This is the discussion forum for our Baja Tour. Feel free to ask questions, share tips, or just say hello. Looking forward to riding with all of you!",
    timestamp: '2025-01-15T10:00:00Z',
    likes: 5,
    replies: [
      {
        id: '1a',
        author: { name: 'Mike R.', avatar: null },
        content: "Can't wait! Already prepping my R1250GS.",
        timestamp: '2025-01-15T12:30:00Z'
      }
    ]
  },
  {
    id: '2',
    author: {
      name: 'Sarah Johnson',
      avatar: null,
      isOrganizer: false
    },
    content: "Question about the border crossing - should we bring any specific documents besides passport? First time riding into Mexico!",
    timestamp: '2025-01-18T14:20:00Z',
    likes: 3,
    replies: [
      {
        id: '2a',
        author: { name: 'Kevin Coleman', avatar: null, isOrganizer: true },
        content: "Great question! You'll need: passport, vehicle registration, proof of insurance (Mexican insurance required), and your driver's license. I'll send out a detailed checklist soon.",
        timestamp: '2025-01-18T15:00:00Z'
      }
    ]
  },
  {
    id: '3',
    author: {
      name: 'Tom Bradley',
      avatar: null,
      isOrganizer: false
    },
    content: "Anyone have recommendations for Mexican motorcycle insurance? Want to get that sorted before the trip.",
    timestamp: '2025-01-20T09:15:00Z',
    likes: 2,
    replies: []
  }
];

export default function DiscussionPage() {
  const { user, signInWithGoogle } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [posts] = useState(samplePosts);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;

    // TODO: Save to Firestore
    alert('Posts will be saved to Firestore once Firebase is configured. Your post: ' + newPost);
    setNewPost('');
  };

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
          {user ? (
            <form onSubmit={handleSubmit}>
              <div className="flex items-start gap-4">
                <img
                  src={user.photoURL || '/default-avatar.png'}
                  alt={user.displayName || 'You'}
                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                />
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share something with the group..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!newPost.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">Sign in to join the discussion</p>
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In with Google
              </button>
            </div>
          )}
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              {/* Post Content */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium">{post.author.name}</span>
                      {post.author.isOrganizer && (
                        <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                          Organizer
                        </span>
                      )}
                      <span className="text-slate-500 text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(post.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-4">
                      <button className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors">
                        <Reply className="h-4 w-4" />
                        <span className="text-sm">Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {post.replies.length > 0 && (
                <div className="bg-slate-900/50 border-t border-slate-700">
                  {post.replies.map((reply) => (
                    <div key={reply.id} className="px-6 py-4 border-b border-slate-700/50 last:border-0">
                      <div className="flex items-start gap-4 ml-14">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium text-sm">{reply.author.name}</span>
                            {'isOrganizer' in reply.author && reply.author.isOrganizer && (
                              <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                                Organizer
                              </span>
                            )}
                            <span className="text-slate-500 text-xs">
                              {formatDate(reply.timestamp)}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
