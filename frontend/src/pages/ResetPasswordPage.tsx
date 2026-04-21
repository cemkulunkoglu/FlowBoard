import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/auth';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = params.get('token') ?? '';
    setToken(t);
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(String(err.response.data));
      } else {
        setError('Sıfırlama başarısız.');
      }
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
            Şifreyi sıfırla
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Yeni şifreni belirle
          </p>
        </div>

        {done ? (
          <p className="rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-800 dark:border-success-900 dark:bg-success-950/40 dark:text-success-300">
            Şifre güncellendi · yönlendiriliyorsun…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Yeni şifre (min 8)
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Şifreyi doğrula
              </span>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>

            {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !token}
              className="mt-2 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {submitting ? 'Sıfırlanıyor…' : 'Şifreyi sıfırla'}
            </button>

            {!token && (
              <p className="text-xs text-danger-600 dark:text-danger-400">
                Geçersiz bağlantı · token yok.
              </p>
            )}
          </form>
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
