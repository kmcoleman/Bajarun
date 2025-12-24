/**
 * Main layout wrapper with header and bottom navigation.
 */

import { ComponentChildren } from 'preact';
import { BottomNav } from './BottomNav';
import { SyncStatus } from './SyncStatus';

interface LayoutProps {
  children: ComponentChildren;
  title: string;
  currentPath: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function Layout({ children, title, currentPath, showBackButton, onBack }: LayoutProps) {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-baja-dark text-white pt-safe">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-1 -ml-1 hover:bg-white/10 rounded"
              >
                ←
              </button>
            )}
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          </div>
          <SyncStatus />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav currentPath={currentPath} />
    </div>
  );
}
