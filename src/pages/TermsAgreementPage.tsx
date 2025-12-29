/**
 * TermsAgreementPage.tsx
 *
 * Requires users to read and accept Privacy Policy and Terms of Service
 * before accessing the app. Users must scroll to bottom before accepting.
 * Content is fetched dynamically from Firebase Storage.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import {
  Shield,
  FileText,
  CheckCircle,
  Loader2,
  ChevronDown,
  Bike,
  AlertCircle
} from 'lucide-react';

export default function TermsAgreementPage() {
  const navigate = useNavigate();
  const { user, acceptTerms, termsAccepted, termsConfig } = useAuth();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic content from Storage
  const [privacyContent, setPrivacyContent] = useState<string | null>(null);
  const [termsContent, setTermsContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);

  // Redirect if already accepted
  useEffect(() => {
    if (termsAccepted) {
      navigate('/tours');
    }
  }, [termsAccepted, navigate]);

  // Fetch markdown content from Storage
  useEffect(() => {
    if (!termsConfig) return;

    const fetchContent = async () => {
      setContentLoading(true);
      setContentError(null);

      try {
        const [privacyRes, termsRes] = await Promise.all([
          fetch(termsConfig.privacyUrl),
          fetch(termsConfig.termsUrl)
        ]);

        if (!privacyRes.ok || !termsRes.ok) {
          throw new Error('Failed to load legal documents');
        }

        const [privacy, terms] = await Promise.all([
          privacyRes.text(),
          termsRes.text()
        ]);

        setPrivacyContent(privacy);
        setTermsContent(terms);
      } catch (err) {
        console.error('Error fetching legal content:', err);
        setContentError('Failed to load legal documents. Please try again.');
      } finally {
        setContentLoading(false);
      }
    };

    fetchContent();
  }, [termsConfig]);

  // Track scroll position
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consider "scrolled to bottom" when within 50px of bottom
      if (scrollHeight - scrollTop - clientHeight < 50) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleAccept = async () => {
    if (!isChecked || !hasScrolledToBottom) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await acceptTerms();
      navigate('/tours');
    } catch (err) {
      console.error('Error accepting terms:', err);
      setError('Failed to save your acceptance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (contentError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{contentError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bike className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to NorCal Moto Adventure</h1>
          <p className="text-slate-400">
            Please review and accept our Privacy Policy and Terms of Service to continue.
          </p>
        </div>

        {/* Scrollable Terms Container */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-96 overflow-y-auto p-6 space-y-8"
          >
            {/* Privacy Policy Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Privacy Policy</h2>
              </div>
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white">
                <ReactMarkdown>{privacyContent || ''}</ReactMarkdown>
              </div>
            </section>

            {/* Divider */}
            <hr className="border-slate-700" />

            {/* Terms of Service Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Terms of Service</h2>
              </div>
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white">
                <ReactMarkdown>{termsContent || ''}</ReactMarkdown>
              </div>
              {/* End marker for scroll detection */}
              <div className="pt-8 text-center">
                <p className="text-slate-500 text-xs">— End of Terms —</p>
              </div>
            </section>
          </div>

          {/* Scroll indicator */}
          {!hasScrolledToBottom && (
            <div className="bg-slate-900 border-t border-slate-700 px-4 py-3 flex items-center justify-center gap-2 text-amber-400">
              <ChevronDown className="h-4 w-4 animate-bounce" />
              <span className="text-sm">Please scroll down to read all terms</span>
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </div>
          )}
        </div>

        {/* Acceptance Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          {/* Checkbox */}
          <label
            className={`flex items-start gap-3 cursor-pointer mb-6 ${
              !hasScrolledToBottom ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => hasScrolledToBottom && setIsChecked(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-1 h-5 w-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800 disabled:opacity-50"
            />
            <span className="text-slate-300">
              I have read and agree to the{' '}
              <span className="text-blue-400">Privacy Policy</span> and{' '}
              <span className="text-blue-400">Terms of Service</span>. I understand and accept
              the risks associated with motorcycle touring.
            </span>
          </label>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleAccept}
            disabled={!isChecked || !hasScrolledToBottom || isSubmitting}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              isChecked && hasScrolledToBottom
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Accept & Continue
              </>
            )}
          </button>

          {!hasScrolledToBottom && (
            <p className="text-center text-slate-500 text-sm mt-4">
              Please scroll to the bottom of the terms to enable acceptance
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
