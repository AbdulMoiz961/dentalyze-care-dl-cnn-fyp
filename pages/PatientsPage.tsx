
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { PatientProfile, User } from '../types.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { AlertMessage } from '../components/AlertMessage.tsx';
import { AddPatientModal } from '../components/AddPatientModal.tsx';

const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const PhoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);

const EmailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);


const PatientCard: React.FC<{ patient: PatientProfile; onSelect: (patientId: string) => void }> = ({ patient, onSelect }) => {
  const avatarColor = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  return (
    <div 
      onClick={() => onSelect(patient.id)}
      className="bg-slate-800/70 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-slate-700/80 hover:border-purple-600/70 hover:shadow-purple-500/30 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group"
    >
      <div className="flex items-start space-x-4">
        <div 
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md group-hover:ring-2 group-hover:ring-purple-400 transition-all flex-shrink-0" 
            style={{ backgroundColor: avatarColor(patient.avatarSeed) }}
            aria-label={`Avatar for ${patient.name}`}
        >
          {patient.name.substring(0, 1).toUpperCase()}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-display font-semibold text-purple-300 group-hover:text-purple-200 transition-colors">{patient.name}</h3>
          <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
            {patient.age ? `Age: ${patient.age}` : 'Age: N/A'}
            {patient.gender && patient.gender !== 'prefer_not_to_say' ? `, Gender: ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}` : ', Gender: N/A'}
          </p>
          {patient.phone && (
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors mt-1 flex items-center">
               <PhoneIcon className="w-3.5 h-3.5 mr-1.5 text-slate-500 group-hover:text-slate-400"/> {patient.phone}
            </p>
          )}
          {patient.email && (
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors mt-1 flex items-center">
               <EmailIcon className="w-3.5 h-3.5 mr-1.5 text-slate-500 group-hover:text-slate-400"/> {patient.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};


export const PatientsPage: React.FC = () => {
  const { currentUser, updateUserProfile, isLoading: authIsLoading } = useAuth();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showFirstPatientPrompt, setShowFirstPatientPrompt] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'dentist') {
      setPatients(currentUser.patients || []);
      const queryParams = new URLSearchParams(window.location.hash.split('?')[1]);
      if (queryParams.get('firstPatientSetup') === 'true' && (currentUser.patients?.length ?? 0) === 0) {
        setShowFirstPatientPrompt(true);
        setIsModalOpen(true); 
        
        const currentFullUrl = window.location.href;
        const parts = currentFullUrl.split('#');
        const baseUrlForReplaceState = parts[0]; 
        const currentHash = window.location.hash || ""; 
        const newHashWithoutQuery = currentHash.split('?')[0];
        
        if (newHashWithoutQuery) { 
            const finalNewUrlForReplaceState = baseUrlForReplaceState + newHashWithoutQuery;
            try {
                history.replaceState(null, '', finalNewUrlForReplaceState);
            } catch (e) {
                console.error("Failed to execute replaceState with full URL:", e, { finalUrl: finalNewUrlForReplaceState });
            }
        }
      } else {
        setShowFirstPatientPrompt(((currentUser.patients?.length ?? 0) === 0));
      }
    }
  }, [currentUser]);

  const handlePatientAdded = (newPatient: PatientProfile) => {
    setPatients(prev => [...prev, newPatient]);
    setShowFirstPatientPrompt(false); 
  };

  const handleSelectPatient = (patientId: string) => {
    window.location.hash = `#/patient-detail/${patientId}`;
  };
  
  const handleAddPatientClick = () => {
    setShowFirstPatientPrompt(false); 
    setIsModalOpen(true);
  }

  if (authIsLoading) {
    return <div className="py-10 flex items-center justify-center"><LoadingSpinner size="lg" /><p className="ml-3 text-white">Loading Patients...</p></div>;
  }

  if (!currentUser || currentUser.role !== 'dentist') {
    return <div className="py-10 flex items-center justify-center text-red-400 p-6">Access Denied. This section is for dental professionals.</div>;
  }
  
  return (
    <div className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-purple-300 tracking-tight text-center sm:text-left mb-4 sm:mb-0">
            Manage Patients
          </h2>
          <button
            onClick={handleAddPatientClick}
            className="flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Add New Patient
          </button>
        </div>

        {pageError && <AlertMessage type="error" message={pageError} onClose={() => setPageError(null)} className="mb-6" />}

        {showFirstPatientPrompt && patients.length === 0 && (
             <AlertMessage type="info" className="mb-8 bg-purple-800/60 border-purple-700 text-purple-200">
                <div className="flex items-start">
                    <UserIcon className="w-8 h-8 mr-4 text-purple-300 shrink-0 mt-1"/>
                    <div>
                        <h3 className="font-semibold text-purple-200 text-lg">Welcome, Doctor!</h3>
                        <p className="text-sm mt-1 mb-3">
                            It looks like you haven't added any patients yet. Click "Add New Patient" to get started and organize your analyses.
                        </p>
                    </div>
                </div>
            </AlertMessage>
        )}

        {patients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patients.map(patient => (
              <PatientCard key={patient.id} patient={patient} onSelect={handleSelectPatient} />
            ))}
          </div>
        ) : (
          !showFirstPatientPrompt && ( 
            <div className="text-center p-10 bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/70">
              <UserIcon className="h-20 w-20 mx-auto text-slate-500 mb-6" />
              <p className="text-2xl font-display text-white mb-3">No Patients Found</p>
              <p className="text-slate-300/90">Click "Add New Patient" to add your first patient record.</p>
            </div>
          )
        )}
      </div>

      {isModalOpen && (
        <AddPatientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPatientAdded={handlePatientAdded}
          currentUser={currentUser as User} 
          updateUserProfile={updateUserProfile}
        />
      )}
    </div>
  );
};