import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

const MASTER_EMAILS = new Set([
  'bianca.segato@v4company.com',
  'thomas.sobral@v4company.com'
]);

const getEnv = (key: string): string | undefined => {
  try {
    // @ts-ignore
    return import.meta?.env?.[key];
  } catch (e) {
    return undefined;
  }
};

const MASTER_PASSWORD = getEnv('VITE_MASTER_PASSWORD') || 'Master@V4Karsten2026';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const normalizedEmail = email.trim().toLowerCase();
  const isMasterEmail = MASTER_EMAILS.has(normalizedEmail);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError("Por favor, insira um e-mail.");
      return;
    }

    if (!normalizedEmail.endsWith('@v4company.com')) {
      setError("Acesso restrito a e-mails @v4company.com");
      return;
    }

    const isMaster = isMasterEmail;

    if (isMaster) {
      if (!MASTER_PASSWORD) {
        setError("Senha master nao configurada.");
        return;
      }

      if (password !== MASTER_PASSWORD) {
        setError("Senha master invalida.");
        return;
      }
    }

    const canEditHealthScore = isMaster;
    const canEditProductivity = isMaster;

    onLogin({
      email: normalizedEmail,
      isMaster,
      isAuthenticated: true,
      permissions: {
        canEditHealthScore,
        canEditProductivity
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 flex items-center justify-center rounded-full mb-4">
            <Lock className="h-6 w-6 text-red-700" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">V4 Karsten &amp; Co</h2>
          <p className="mt-2 text-sm text-gray-600">
            Produtividade e Lucratividade
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Endereco de E-mail</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-t relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="seu.nome@v4company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {isMasterEmail && (
              <div>
                <label htmlFor="password" className="sr-only">Senha master</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-b relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Senha master"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm justify-center bg-red-50 p-2 rounded">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
