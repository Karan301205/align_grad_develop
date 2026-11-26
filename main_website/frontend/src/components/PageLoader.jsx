import { Component } from 'react';
import { RefreshCw } from 'lucide-react';

/** Shown while a page's file loads (the Suspense fallback for lazy pages). */
export function PageLoader({ fullScreen = false }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${fullScreen ? 'min-h-screen bg-background' : 'py-24'}`}
    >
      <RefreshCw className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
    </div>
  );
}

/** Shows a plain message with a Reload button when a page can't load or crashes, instead of a blank screen. */
export class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('[pages] The page could not be shown:', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen bg-background text-on-surface font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <h1 className="font-headline text-xl font-medium text-on-surface">This page didn’t load</h1>
          <p className="text-sm text-on-surface-variant">Something went wrong while opening this page. Please reload to try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl glass-button-primary text-on-primary text-sm font-semibold hover:brightness-110 transition-all"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
