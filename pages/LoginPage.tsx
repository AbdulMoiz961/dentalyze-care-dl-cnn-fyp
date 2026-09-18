import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { AlertMessage } from '../components/AlertMessage.tsx';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { APP_NAME } from '../constants.ts';
import { UserRole } from '../types.ts';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleAttempt, setRoleAttempt] = useState<UserRole>('patient');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading: authIsLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password, roleAttempt);
      window.location.hash = '#/analyzer'; 
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    window.location.hash = path;
  };
  
  const effectiveIsLoading = isSubmitting || authIsLoading;

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-slate-800 shadow-2xl rounded-xl border border-slate-700/80 backdrop-blur-sm bg-opacity-80">
        <div>
          <h2 className="mt-6 text-center text-4xl font-display font-extrabold text-white">
            Login to <span className="text-purple-400">{APP_NAME}</span>
          </h2>
          <p className="mt-3 text-center text-sm text-slate-400">
            Or{' '}
            <a 
              href="#/signup" 
              onClick={(e) => handleNav(e, '#/signup')}
              className="font-medium text-purple-400 hover:text-purple-300 transition-colors duration-150"
            >
              create a new account
            </a>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} className="my-4" />}
          
          <div className="space-y-5 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3.5 border border-slate-700 bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm rounded-lg transition-shadow duration-150 shadow-sm hover:shadow-md focus:shadow-lg"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={effectiveIsLoading}
              />
            </div>
            <div>
              <label htmlFor="password"  className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3.5 border border-slate-700 bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm rounded-lg transition-shadow duration-150 shadow-sm hover:shadow-md focus:shadow-lg"
                placeholder="Password (any for demo)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={effectiveIsLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Login as:</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-200 hover:text-white">
                  <input
                    type="radio"
                    name="roleAttempt"
                    value="patient"
                    checked={roleAttempt === 'patient'}
                    onChange={() => setRoleAttempt('patient')}
                    className="form-radio h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 focus:ring-purple-500 transition duration-150 ease-in-out"
                    disabled={effectiveIsLoading}
                  />
                  <span>Patient</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-slate-200 hover:text-white">
                  <input
                    type="radio"
                    name="roleAttempt"
                    value="dentist"
                    checked={roleAttempt === 'dentist'}
                    onChange={() => setRoleAttempt('dentist')}
                    className="form-radio h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 focus:ring-purple-500 transition duration-150 ease-in-out"
                    disabled={effectiveIsLoading}
                  />
                  <span>Dentist</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={effectiveIsLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-150 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {effectiveIsLoading ? <LoadingSpinner size="sm" /> : 'Login'}
            </button>
          </div>
           <p className="mt-5 text-center text-xs text-slate-500">
            (Demo: any valid email format and any password will work. Role selection will be checked if email exists.)
          </p>
        </form>
      </div>
    </div>
  );
};