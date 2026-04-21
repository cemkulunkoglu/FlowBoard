import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Hoş geldin!');
      navigate('/', { replace: true });
    } catch {
      setError('E-posta veya şifre hatalı.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@flowboard.dev');
    setPassword('demo1234');
    toast.info('Demo hesabı dolduruldu · şifre: demo1234');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-linear-to-br from-primary-500 to-purple-500" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">FlowBoard'a giriş</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gerçek zamanlı Kanban</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">E-posta</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Şifre</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>

          <button
            type="button"
            onClick={fillDemo}
            className="text-xs text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
          >
            Demo hesabı doldur
          </button>
        </form>

        <p className="mt-4 text-center text-xs">
          <Link
            to="/forgot-password"
            className="font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
          >
            Şifremi unuttum
          </Link>
        </p>

        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Hesabın yok mu?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
