import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { APP_NAME } from '../constants.ts';
import { AlertMessage } from '../components/AlertMessage.tsx';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }> = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
    <input
      id={id}
      {...props}
      className={`appearance-none relative block w-full px-4 py-3.5 border border-slate-700 bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg transition-shadow duration-150 shadow-sm hover:shadow-md focus:shadow-lg disabled:opacity-70 ${props.className || ''}`}
    />
  </div>
);

const InfoDisplayField: React.FC<{ label: string; value: string; subtext?: string }> = ({ label, value, subtext }) => (
  <div>
    <p className="block text-sm font-medium text-slate-300 mb-1.5">{label}</p>
    <div className="px-4 py-3.5 bg-slate-600/50 text-slate-200 rounded-lg text-sm">
      {value}
      {subtext && <span className="text-xs text-slate-400 ml-2">{subtext}</span>}
    </div>
  </div>
);


export const ProfilePage: React.FC = () => {
  const { currentUser, logout, updateUserProfile, isLoading: authIsLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setCompanyNameInput(currentUser.companyName || '');
      setCompanyLogoPreview(currentUser.companyLogoBase64 || null);
    }
  }, [currentUser]);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUpdateMessage(null);
    if (file) {
      if (!file.type.startsWith('image/')) { setUpdateMessage({type: 'error', text: 'Invalid file. Please upload an image (PNG/JPG).'}); setCompanyLogoFile(null); return; }
      if (file.size > 2 * 1024 * 1024) { setUpdateMessage({type: 'error', text: 'Logo file too large (Max 2MB).'}); setCompanyLogoFile(null); return; }
      setCompanyLogoFile(file); setCompanyLogoPreview(URL.createObjectURL(file));
    } else { setCompanyLogoFile(null); setCompanyLogoPreview(currentUser?.companyLogoBase64 || null); }
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!currentUser) return;
    setUpdateMessage(null); setIsUpdating(true);
    try {
      let logoBase64Update = currentUser.companyLogoBase64; 
      if (companyLogoFile) logoBase64Update = await fileToBase64(companyLogoFile);
      else if (companyLogoPreview === null && currentUser.companyLogoBase64) logoBase64Update = undefined; 

      await updateUserProfile({ name, companyName: companyNameInput, companyLogoBase64: logoBase64Update });
      setUpdateMessage({type: 'success', text: 'Profile updated successfully!'});
    } catch (error: any) { setUpdateMessage({type: 'error', text: error.message || 'Failed to update profile.'});
    } finally { setIsUpdating(false); }
  };

  const handleLogout = async () => {
    try { await logout(); window.location.hash = '#/login'; } 
    catch (error) { console.error("Logout failed", error); setUpdateMessage({type: 'error', text: 'Logout failed. Please try again.'}); }
  };
  
  const effectiveIsLoading = isUpdating || authIsLoading;

  if (authIsLoading && !currentUser) {
    return <div className="flex items-center justify-center text-white py-10"><LoadingSpinner size="lg"/> <span className="ml-4 font-display text-xl">Loading profile...</span></div>;
  }
  if (!currentUser) return <div className="flex flex-col items-center justify-center text-white p-6 text-center py-10"><p className="text-2xl font-display mb-2">Access Denied</p><p className="text-slate-400">Please login to view your profile.</p></div>;

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-10 p-8 sm:p-10 bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-xl border border-slate-700/80 text-white">
        <h2 className="text-4xl font-display font-extrabold text-center text-purple-300">
          Your {APP_NAME} Profile
        </h2>
        {updateMessage && <AlertMessage type={updateMessage.type} message={updateMessage.text} onClose={() => setUpdateMessage(null)} className="my-5" />}
        <form onSubmit={handleProfileUpdate} className="space-y-10">
          <section className="p-6 bg-slate-700/50 rounded-xl shadow-lg border border-slate-600/70">
            <h3 className="text-2xl font-display font-semibold text-purple-400 mb-6 border-b border-slate-600 pb-4">Account Information</h3>
            <div className="space-y-5">
              <InputField label="Full Name" id="profile-name" type="text" value={name} onChange={e => setName(e.target.value)} required disabled={effectiveIsLoading} />
              <InfoDisplayField label="Email Address" value={currentUser.email} subtext="(Cannot be changed)" />
              <InfoDisplayField label="Account Type" value={currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} subtext="(Cannot be changed)" />
            </div>
          </section>
          <section className="p-6 bg-slate-700/50 rounded-xl shadow-lg border border-slate-600/70">
            <h3 className="text-2xl font-display font-semibold text-purple-400 mb-6 border-b border-slate-600 pb-4">Company Branding (for PDF Reports)</h3>
            <div className="space-y-5">
              <InputField label="Company Name (Optional)" id="company-name-input" type="text" value={companyNameInput} onChange={e => setCompanyNameInput(e.target.value)} disabled={effectiveIsLoading} placeholder="Your Company Inc." />
              <div>
                <label htmlFor="company-logo" className="block text-sm font-medium text-slate-300 mb-1.5">Company Logo (Optional, PNG/JPG, max 2MB)</label>
                <input type="file" id="company-logo" accept="image/png, image/jpeg" onChange={handleLogoChange} disabled={effectiveIsLoading}
                       className="mt-1 block w-full text-sm text-slate-300 file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 disabled:opacity-50 cursor-pointer file:transition-colors file:duration-150"/>
                {companyLogoPreview && (
                  <div className="mt-4 p-3 bg-slate-600/40 rounded-lg inline-block border border-slate-500/50">
                    <p className="text-xs text-slate-400 mb-1.5">Logo Preview:</p>
                    <img src={companyLogoPreview} alt="Company Logo Preview" className="max-h-24 h-auto bg-white p-1.5 rounded border border-slate-500 shadow-md"/>
                    <button type="button" onClick={() => { setCompanyLogoFile(null); setCompanyLogoPreview(null);}} disabled={effectiveIsLoading} className="mt-2.5 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50">Remove Logo</button>
                  </div>
                )}
              </div>
            </div>
          </section>
          <div className="mt-10 flex flex-col space-y-4">
            <button type="submit" disabled={effectiveIsLoading} className="group w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-150 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105">
              {isUpdating ? <LoadingSpinner size="sm" /> : 'Save Profile Changes'}
            </button>
            <button type="button" onClick={handleLogout} disabled={effectiveIsLoading} className="group w-full flex justify-center py-3.5 px-4 border border-red-600/80 text-base font-medium rounded-lg text-red-300 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 disabled:bg-slate-600 disabled:text-slate-400 disabled:border-slate-600 disabled:cursor-not-allowed transition-all duration-150 ease-in-out shadow-sm hover:shadow-md">
              {authIsLoading && !isUpdating ? <LoadingSpinner size="sm" color="text-red-400"/> : 'Logout'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-center text-xs text-slate-500"> User ID (Demo): {currentUser.id} </p>
      </div>
    </div>
  );
};