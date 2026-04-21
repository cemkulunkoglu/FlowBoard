import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setMessage(res.message);
      setDevToken(res.devToken ?? null);
    } catch {
      setMessage('Bir hata oluştu. Tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-linear-to-br from-primary-500 to-purple-500" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Şifremi unuttum
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sıfırlama bağlantısını e-postana gönderelim
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">E-posta</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Gönderiliyor…' : 'Sıfırlama linki gönder'}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-lg border border-info-200 bg-info-50 px-3 py-2 text-xs text-info-800 dark:border-info-900 dark:bg-info-950/40 dark:text-info-300">
            {message}
            {devToken && (
              <div className="mt-2">
                <p className="font-semibold">Dev modu:</p>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(devToken)}`}
                  className="break-all underline"
                >
                  /reset-password?token={devToken}
                </Link>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            Girişe dön
          </Link>
        </p>
      </div>
    </div>
  );
}
