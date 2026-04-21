import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/auth';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState<string>('Doğrulanıyor…');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('Token yok.');
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => {
        setState('success');
        setMessage('E-postan doğrulandı.');
      })
      .catch((err) => {
        setState('error');
        if (axios.isAxiosError(err) && err.response?.data) {
          setMessage(String(err.response.data));
        } else {
          setMessage('Doğrulama başarısız.');
        }
      });
  }, [params]);

  const styles = {
    pending: 'border-slate-200 bg-slate-50 text-slate-700',
    success:
      'border-success-200 bg-success-50 text-success-800 dark:border-success-900 dark:bg-success-950/40 dark:text-success-300',
    error:
      'border-danger-200 bg-danger-50 text-danger-800 dark:border-danger-900 dark:bg-danger-950/40 dark:text-danger-300',
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-linear-to-br from-primary-500 to-purple-500" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            E-posta doğrulama
          </h1>
        </div>

        <div className={`rounded-lg border px-3 py-2 text-sm ${styles[state]}`}>{message}</div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            Panolara dön
          </Link>
        </p>
      </div>
    </div>
  );
}
