/**
 * CacheHelpPage.tsx
 *
 * Instructions for users on how to hard reload and clear cache
 * across different browsers and platforms.
 */

import {
  Monitor,
  Smartphone,
  RefreshCw,
  EyeOff,
  Globe,
} from 'lucide-react';

export default function CacheHelpPage() {
  return (
    <div className="min-h-screen py-8 bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Trouble Seeing Updates?
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            If the app isn't showing the latest changes, try a hard reload to clear your browser's cache.
            Follow the instructions for your device and browser below.
          </p>
        </div>

        {/* Hard Reload Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Hard Reload</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Mac */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-700/50 px-4 py-3 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-slate-400" />
                <h3 className="font-semibold text-white">Mac</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Safari */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-white">Safari</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">⌘ Cmd</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">⌥ Option</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">R</kbd>
                  </div>
                  <p className="text-slate-500 text-sm mt-2">
                    Or: Hold ⇧ Shift and click the Reload button
                  </p>
                </div>

                {/* Chrome */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="font-medium text-white">Chrome</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">⌘ Cmd</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">⇧ Shift</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">R</kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Windows */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-700/50 px-4 py-3 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-slate-400" />
                <h3 className="font-semibold text-white">Windows</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Chrome */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="font-medium text-white">Chrome</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">Shift</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">R</kbd>
                  </div>
                  <p className="text-slate-500 text-sm mt-2">
                    Or: <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">F5</kbd>
                  </p>
                </div>

                {/* Edge */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-teal-400"></div>
                    <span className="font-medium text-white">Edge</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">Shift</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">R</kbd>
                  </div>
                  <p className="text-slate-500 text-sm mt-2">
                    Or: <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">F5</kbd>
                  </p>
                </div>
              </div>
            </div>

            {/* iOS */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-700/50 px-4 py-3 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-slate-400" />
                <h3 className="font-semibold text-white">iPhone / iPad</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Safari iOS */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-white">Safari</span>
                  </div>
                  <ol className="text-slate-300 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">1.</span>
                      <span>Open <strong>Settings</strong> app</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span>Scroll down and tap <strong>Safari</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">3.</span>
                      <span>Tap <strong>Clear History and Website Data</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">4.</span>
                      <span>Confirm and reopen the website</span>
                    </li>
                  </ol>
                </div>

                {/* Chrome iOS */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="font-medium text-white">Chrome</span>
                  </div>
                  <ol className="text-slate-300 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">1.</span>
                      <span>Tap <strong>⋯</strong> (three dots) menu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span>Tap <strong>Settings</strong> → <strong>Privacy</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">3.</span>
                      <span>Tap <strong>Clear Browsing Data</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">4.</span>
                      <span>Select <strong>Cached Images and Files</strong></span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Android */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-700/50 px-4 py-3 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-slate-400" />
                <h3 className="font-semibold text-white">Android</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Chrome Android */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="font-medium text-white">Chrome</span>
                  </div>
                  <ol className="text-slate-300 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">1.</span>
                      <span>Tap <strong>⋮</strong> (three dots) menu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span>Tap <strong>Settings</strong> → <strong>Privacy</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">3.</span>
                      <span>Tap <strong>Clear browsing data</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">4.</span>
                      <span>Check <strong>Cached images and files</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">5.</span>
                      <span>Tap <strong>Clear data</strong></span>
                    </li>
                  </ol>
                </div>

                {/* Edge Android */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-teal-400"></div>
                    <span className="font-medium text-white">Edge</span>
                  </div>
                  <ol className="text-slate-300 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">1.</span>
                      <span>Tap <strong>⋯</strong> menu → <strong>Settings</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span>Tap <strong>Privacy and security</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">3.</span>
                      <span>Tap <strong>Clear browsing data</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">4.</span>
                      <span>Select <strong>Cached images and files</strong></span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-slate-700 my-10"></div>

        {/* Private/Incognito Window Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <EyeOff className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Private / Incognito Window</h2>
          </div>
          <p className="text-slate-400 mb-6">
            A private window doesn't use your existing cache. This is a quick way to test if caching is the issue.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Desktop */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-purple-600/20 px-4 py-3 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-white">Desktop (Mac & Windows)</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Safari */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-white">Safari</span>
                    <span className="text-slate-500 text-sm">(Mac only)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">⌘ Cmd</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">⇧ Shift</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">N</kbd>
                  </div>
                  <p className="text-slate-500 text-sm mt-2">Opens "Private Window"</p>
                </div>

                {/* Chrome */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="font-medium text-white">Chrome</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-slate-500 text-sm w-12">Mac:</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">⌘</kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">⇧</kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">N</kbd>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-slate-500 text-sm w-12">Win:</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">Ctrl</kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">Shift</kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">N</kbd>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mt-2">Opens "Incognito Window"</p>
                </div>

                {/* Edge */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-teal-400"></div>
                    <span className="font-medium text-white">Edge</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">Shift</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-sm font-mono">N</kbd>
                  </div>
                  <p className="text-slate-500 text-sm mt-2">Opens "InPrivate Window"</p>
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-purple-600/20 px-4 py-3 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-white">Mobile (iOS & Android)</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Safari iOS */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-white">Safari</span>
                    <span className="text-slate-500 text-sm">(iOS)</span>
                  </div>
                  <ol className="text-slate-300 text-sm space-y-1">
                    <li>1. Tap the tabs icon (two squares)</li>
                    <li>2. Tap <strong>Private</strong> at bottom</li>
                    <li>3. Tap <strong>+</strong> to open new private tab</li>
                  </ol>
                </div>

                {/* Chrome Mobile */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="font-medium text-white">Chrome</span>
                    <span className="text-slate-500 text-sm">(iOS & Android)</span>
                  </div>
                  <ol className="text-slate-300 text-sm space-y-1">
                    <li>1. Tap <strong>⋮</strong> or <strong>⋯</strong> menu</li>
                    <li>2. Tap <strong>New Incognito Tab</strong></li>
                  </ol>
                </div>

                {/* Edge Mobile */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-teal-400"></div>
                    <span className="font-medium text-white">Edge</span>
                    <span className="text-slate-500 text-sm">(Android)</span>
                  </div>
                  <ol className="text-slate-300 text-sm space-y-1">
                    <li>1. Tap <strong>⋯</strong> menu</li>
                    <li>2. Tap <strong>New InPrivate tab</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Still having issues */}
        <div className="mt-10 p-6 bg-amber-600/10 border border-amber-500/30 rounded-xl">
          <h3 className="text-lg font-semibold text-amber-300 mb-2">Still having issues?</h3>
          <p className="text-amber-200/80 text-sm">
            If clearing cache doesn't help, try closing and reopening your browser completely,
            or contact us at <a href="mailto:bmwriderkmc@gmail.com" className="underline hover:text-amber-100">bmwriderkmc@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
