
"use client";
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError('Neplatné přihlašovací údaje.');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="form-group">
        <label className="form-label">
          <span className="label-text">Uživatelské jméno</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="form-input"
            placeholder="Zadejte uživatelské jméno"
          />
        </label>
      </div>
      
      <div className="form-group">
        <label className="form-label">
          <span className="label-text">Heslo</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
            placeholder="Zadejte heslo"
          />
        </label>
      </div>
      
      {error && (
        <div className="error-message">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="loading-spinner mr-3"></div>
            Přihlašuji...
          </div>
        ) : (
          'Přihlásit se'
        )}
      </button>
    </form>
  );
}
