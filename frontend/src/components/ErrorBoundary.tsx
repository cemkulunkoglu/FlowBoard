import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary yakaladı:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-xl border border-danger-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-danger-700">Bir şeyler ters gitti</h1>
            <p className="mt-2 text-sm text-slate-600">
              Beklenmeyen bir hata oluştu. Sayfayı yenileyebilir veya aşağıdaki butonla tekrar
              deneyebilirsin.
            </p>
            <pre className="mt-3 max-h-32 overflow-auto rounded bg-slate-100 p-2 text-xs text-slate-700">
              {this.state.error.message}
            </pre>
            <div className="mt-4 flex gap-2">
              <button
                onClick={this.reset}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                Tekrar dene
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Sayfayı yenile
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
