import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PAMASense application error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 p-8">
        <div className="panel max-w-xl p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 text-pama-red" size={44} aria-hidden />
          <h1 className="text-xl font-bold text-pama-navy">PAMASense encountered an error</h1>
          <p className="mt-2 text-sm text-slate-600">{this.state.error.message}</p>
          <button className="control-btn mt-6" onClick={() => window.location.reload()}>
            <RotateCcw size={16} /> Reload application
          </button>
        </div>
      </div>
    );
  }
}
