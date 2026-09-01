import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last-resort fallback so an unexpected render error (e.g. a bad Leaflet
 * call) shows a visible, non-blank message instead of tearing down the
 * whole React tree with no UI at all — the free-browsing entry point
 * (FR1) should never go fully blank.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled error rendering the app:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-2 bg-white px-4 text-center">
          <h1 className="text-lg font-semibold text-slate-900">GéoEmploi</h1>
          <p role="alert" className="text-sm text-slate-600">
            Une erreur inattendue est survenue. Merci de recharger la page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
