import React, { useState, useEffect, useCallback } from 'react';
import { ImageAnalyzer } from '../components/ImageAnalyzer';
import { useAuth } from '../contexts/AuthContext.tsx';
import { AlertMessage } from '../components/AlertMessage.tsx';
import { PatientProfile } from '../types'; 
import { AddPatientModal } from '../components/AddPatientModal.tsx'; 

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);

const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
);

const PlusCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


interface AnalyzerPageProps {
  patientIdFromQuery?: string | null;
}

export const AnalyzerPage: React.FC<AnalyzerPageProps> = ({ patientIdFromQuery }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const [showBrandingPrompt, setShowBrandingPrompt] = useState(false);
  const [showAddFirstPatientPrompt, setShowAddFirstPatientPrompt] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [analyzerKey, setAnalyzerKey] = useState(Date.now()); 
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);

  const getPatientSelectionLsKey = useCallback((userId?: string): string | null => {
    if (!userId) return null;
    return `dentalyze_selected_patient_${userId}`;
  }, []);


  useEffect(() => {
    setAnalyzerError(null); 
    try {
        if (currentUser?.role === 'dentist') {
        const patientSelectionLsKey = getPatientSelectionLsKey(currentUser?.id);

        if (currentUser?.id) {
            const brandingPromptDismissedKey = `dentalyze_branding_prompt_dismissed_${currentUser.id}`;
            const dismissedBranding = localStorage.getItem(brandingPromptDismissedKey);
            if (!currentUser.companyName && !currentUser.companyLogoBase64 && !dismissedBranding) {
            setShowBrandingPrompt(true);
            } else {
            setShowBrandingPrompt(false);
            }
        }

        const queryParams = new URLSearchParams(window.location.hash.split('?')[1]);
        if ((currentUser.patients?.length ?? 0) === 0 && queryParams.get('fromPatientsPage') !== 'true') {
                setShowAddFirstPatientPrompt(true);
        } else {
            setShowAddFirstPatientPrompt(false);
        }

        if (patientSelectionLsKey) {
            if (patientIdFromQuery) {
            const patient = currentUser.patients?.find(p => p.id === patientIdFromQuery);
            if (patient) {
                setSelectedPatientId(patient.id);
                setSelectedPatientName(patient.name);
                localStorage.setItem(patientSelectionLsKey, patient.id);
            } else { 
                localStorage.removeItem(patientSelectionLsKey);
                setSelectedPatientId(null); setSelectedPatientName(null);
            }
            } else {
            const lastSelectedId = localStorage.getItem(patientSelectionLsKey);
            if (lastSelectedId) {
                const patient = currentUser.patients?.find(p => p.id === lastSelectedId);
                if (patient) {
                setSelectedPatientId(patient.id);
                setSelectedPatientName(patient.name);
                } else { 
                localStorage.removeItem(patientSelectionLsKey);
                setSelectedPatientId(null); setSelectedPatientName(null);
                }
            } else {
                setSelectedPatientId(null); setSelectedPatientName(null);
            }
            }
        }
        } else { 
        setShowBrandingPrompt(false);
        setShowAddFirstPatientPrompt(false);
        setSelectedPatientId(null);
        setSelectedPatientName(null);
        }
    } catch (e: any) {
        console.error("LocalStorage error in AnalyzerPage useEffect:", e);
        setAnalyzerError(`Failed to load/save preferences: ${e.message}. Some features may not work as expected.`);
    }
  }, [currentUser, patientIdFromQuery, getPatientSelectionLsKey]);
  
  const handleDismissBrandingPrompt = () => {
    setAnalyzerError(null);
    if (currentUser?.id) {
      const brandingPromptDismissedKey = `dentalyze_branding_prompt_dismissed_${currentUser.id}`;
      try {
        localStorage.setItem(brandingPromptDismissedKey, 'true');
        setShowBrandingPrompt(false);
      } catch (e: any) {
        console.error("LocalStorage error dismissing branding prompt:", e);
        setAnalyzerError(`Failed to save preference: ${e.message}.`);
      }
    }
  };

  const handleNavigateToProfile = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); window.location.hash = '#/profile'; setShowBrandingPrompt(false);
  };
  
  const handleNavigateToPatients = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); window.location.hash = '#/patients'; setShowAddFirstPatientPrompt(false);
  };

  const handlePatientSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAnalyzerError(null);
    const patientIdValue = event.target.value;
    const patientSelectionLsKey = getPatientSelectionLsKey(currentUser?.id);

    if (patientIdValue === "add_new_patient") {
      setIsAddPatientModalOpen(true);
    } else if (patientIdValue && patientSelectionLsKey) {
      const patient = currentUser?.patients?.find(p => p.id === patientIdValue);
      if (patient) {
        setSelectedPatientId(patient.id);
        setSelectedPatientName(patient.name);
        try { localStorage.setItem(patientSelectionLsKey, patient.id); } 
        catch (e: any) { console.error("LocalStorage error selecting patient:",e); setAnalyzerError(`Failed to save patient selection: ${e.message}.`);}
      }
    } else { 
      setSelectedPatientId(null);
      setSelectedPatientName(null);
      if (patientSelectionLsKey) {
        try { localStorage.removeItem(patientSelectionLsKey); }
        catch (e: any) { console.error("LocalStorage error clearing patient selection:",e); setAnalyzerError(`Failed to clear patient selection: ${e.message}.`);}
      }
    }
  };

  const handlePatientAdded = (newPatient: PatientProfile) => {
    setAnalyzerError(null);
    const patientSelectionLsKey = getPatientSelectionLsKey(currentUser?.id);
    if (patientSelectionLsKey) {
        setSelectedPatientId(newPatient.id);
        setSelectedPatientName(newPatient.name);
        try { localStorage.setItem(patientSelectionLsKey, newPatient.id); }
        catch (e: any) { console.error("LocalStorage error saving new patient selection:",e); setAnalyzerError(`Failed to save selection for new patient: ${e.message}.`);}
    }
    setIsAddPatientModalOpen(false);
    setShowAddFirstPatientPrompt(false); 
    setAnalyzerKey(Date.now()); 
  };
  
  const clearPatientSelection = () => {
    setAnalyzerError(null);
    setSelectedPatientId(null);
    setSelectedPatientName(null);
    const patientSelectionLsKey = getPatientSelectionLsKey(currentUser?.id);
    if (patientSelectionLsKey) {
        try { localStorage.removeItem(patientSelectionLsKey); }
        catch (e: any) { console.error("LocalStorage error clearing patient selection (button):",e); setAnalyzerError(`Failed to clear patient selection: ${e.message}.`);}
    }
    const currentHash = window.location.hash;
    const [path, query] = currentHash.split('?');
    if (query) {
        const params = new URLSearchParams(query);
        if (params.has('patientId')) {
            params.delete('patientId');
            window.location.hash = params.toString() ? `${path}?${params.toString()}` : path;
        }
    }
  };


  return (
    <div className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-display font-bold text-purple-300 sm:text-6xl tracking-tight">
            AI Dental X-Ray Analysis
          </h1>
          {currentUser && (
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Welcome, <span className="font-semibold text-purple-400">{currentUser.name}</span>! 
              {currentUser.role === 'dentist' && selectedPatientName && ` You are analyzing for: `}
              {currentUser.role === 'dentist' && selectedPatientName && <span className="font-semibold text-green-400">{selectedPatientName}</span>}
              {currentUser.role !== 'dentist' && ' Upload an X-ray image below to get an AI-powered analysis.'}
            </p>
          )}
        </header>
        
        {analyzerError && <AlertMessage type="error" message={analyzerError} onClose={() => setAnalyzerError(null)} className="my-6 max-w-3xl mx-auto" />}

        {showBrandingPrompt && currentUser && (
          <div className="mb-8 max-w-3xl mx-auto">
            <AlertMessage type="info" onClose={handleDismissBrandingPrompt} className="bg-purple-800/70 border-purple-700 text-purple-100 backdrop-blur-sm">
              <div className="flex items-start"> <InfoIcon className="w-6 h-6 mr-3 text-purple-300 shrink-0 mt-0.5"/>
                <div> <h3 className="font-semibold text-purple-200">Enhance Your Reports!</h3>
                  <p className="text-sm mt-1 mb-3 text-purple-200/90"> Add your company name and logo in your profile to include them on downloaded PDF reports. This is optional. </p>
                  <a href="#/profile" onClick={handleNavigateToProfile} className="inline-block bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-colors mr-2"> Go to Profile </a>
                  <button onClick={handleDismissBrandingPrompt} className="text-xs text-purple-300 hover:text-purple-200 py-1.5 px-3 rounded-md"> Skip for now </button>
                </div>
              </div>
            </AlertMessage>
          </div>
        )}

        {showAddFirstPatientPrompt && currentUser?.role === 'dentist' && (
             <div className="mb-10 max-w-3xl mx-auto p-8 bg-slate-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-purple-700/70 text-center">
                <UserGroupIcon className="w-16 h-16 mx-auto text-purple-400 mb-5"/>
                <h2 className="text-3xl font-display font-semibold text-purple-300 mb-4">Manage Your Patients</h2>
                <p className="text-slate-300 mb-6">
                    To begin analyzing X-rays for your practice, please add your first patient. You can manage all patient records from the "Patients" section.
                </p>
                <a href="#/patients" onClick={handleNavigateToPatients}
                   className="inline-flex items-center justify-center group bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold px-8 py-3 rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105 text-lg">
                    <PlusCircleIcon className="w-6 h-6 mr-2.5"/> Go to Patients Page
                </a>
            </div>
        )}

        {currentUser?.role === 'dentist' && !showAddFirstPatientPrompt && (
          <div className="mb-10 max-w-xl mx-auto p-6 bg-slate-700/50 rounded-xl shadow-lg border border-slate-600/80">
            <label htmlFor="patient-select" className="block text-lg font-display font-medium text-purple-300 mb-3">
              Analyzing For Patient:
            </label>
            <div className="flex items-center space-x-3">
              <select
                id="patient-select"
                value={selectedPatientId || ""}
                onChange={handlePatientSelectChange}
                className="block w-full py-3 px-4 border border-slate-600 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg transition-shadow duration-150 shadow-sm"
                disabled={isAddPatientModalOpen}
              >
                <option value="">-- Select a Patient --</option>
                {currentUser.patients?.map(patient => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
                <option value="add_new_patient" className="text-green-400 font-semibold">... Add New Patient ...</option>
              </select>
              {selectedPatientId && (
                 <button onClick={clearPatientSelection} title="Clear selected patient" className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs">Clear</button>
              )}
            </div>
            {!selectedPatientId && <p className="text-xs text-yellow-400 mt-2 italic">Please select or add a patient to enable analysis.</p>}
          </div>
        )}
        
        {isAddPatientModalOpen && currentUser && (
          <AddPatientModal
            isOpen={isAddPatientModalOpen}
            onClose={() => setIsAddPatientModalOpen(false)}
            onPatientAdded={handlePatientAdded}
            currentUser={currentUser}
            updateUserProfile={updateUserProfile}
          />
        )}

        {(!showAddFirstPatientPrompt || currentUser?.role !== 'dentist') && ( 
            <ImageAnalyzer 
                key={analyzerKey} 
                reportDisplayId="analyzer-report-content"
                patientIdForAnalysis={ (currentUser?.role === 'dentist' && selectedPatientId) ? selectedPatientId : null }
            />
        )}
      </div>
    </div>
  );
};