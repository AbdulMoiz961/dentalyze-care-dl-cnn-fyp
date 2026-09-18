
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { PatientProfile, AnalysisHistoryItem } from '../types.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { AlertMessage } from '../components/AlertMessage.tsx';
import { HistoryPage } from './HistoryPage'; 
import { XRayComparisonModal } from '../components/XRayComparisonModal.tsx';
import { EditPatientModal } from '../components/EditPatientModal.tsx'; 
import { apiGetHistory, apiUpdatePatient } from '../services/serviceService';
const ClipboardDocumentListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25m0 0H6.375V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 011.123-.08m-5.8 0c.065.21.1.433.1.664M3.75 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m3-5.25H9" />
  </svg>
);
const PhoneIconSlim: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className="w-4 h-4 mr-1.5 text-slate-400 inline-block align-middle">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const EmailIconSlim: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className="w-4 h-4 mr-1.5 text-slate-400 inline-block align-middle">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);


const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const CompareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
);

interface PatientDetailPageProps {
  patientId: string;
}

export const PatientDetailPage: React.FC<PatientDetailPageProps> = ({ patientId }) => {
  const { currentUser, refreshPatients, isLoading: authIsLoading } = useAuth();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [medicalNotesInput, setMedicalNotesInput] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesSuccess, setNotesSuccess] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);


  const getAvatarStyle = (seed: string): React.CSSProperties => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const color = "#" + "00000".substring(0, 6 - c.length) + c;
    return { backgroundColor: color };
  };
  
  useEffect(() => {
    if (currentUser?.role === 'dentist') {
      const foundPatient = currentUser.patients?.find(p => p.id === patientId);
      if (foundPatient) {
        setPatient(foundPatient);
        setMedicalNotesInput(foundPatient.medicalNotes || '');
        setError(null); 
      } else {
        setError("Patient not found for this dentist.");
        setPatient(null);
      }

      apiGetHistory(1, 100, patientId)
        .then((res) => {
          setAnalysisHistory(res.items || []);
        })
        .catch((e) => {
          console.error("Error loading patient history", e);
        });
    } else if (currentUser) { 
      setError("Access denied. This section is for dental professionals.");
      setPatient(null);
    } else {
      setPatient(null); 
    }
  }, [currentUser, patientId]);

  const handleAnalyzeNew = () => {
    if (patient) {
      window.location.hash = `#/analyzer?patientId=${patient.id}&fromPatientsPage=true`;
    }
  };

  const handleSaveNotes = async () => {
    if (!patient || !currentUser || currentUser.role !== 'dentist') return;
    setIsSavingNotes(true);
    setNotesError(null);
    setNotesSuccess(null);
    try {
      const updated = await apiUpdatePatient(patient.id, { medical_notes: medicalNotesInput });
      const updatedPatientProfile: PatientProfile = {
        ...patient,
        medicalNotes: updated.medical_notes,
      };
      setPatient(updatedPatientProfile);
      if (refreshPatients) {
        await refreshPatients();
      }
      setNotesSuccess("Medical notes saved successfully!");
      setIsEditingNotes(false);
    } catch (e: any) {
      console.error("Failed to save notes:", e);
      setNotesError(e.message || "An error occurred while saving notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handlePatientUpdated = (updatedPatient: PatientProfile) => {
    setPatient(updatedPatient); 
    if (updatedPatient.medicalNotes !== undefined) { 
      setMedicalNotesInput(updatedPatient.medicalNotes);
    }
    if (updatedPatient.email !== undefined) {
        // No specific action needed here as patient state is updated
    }
  };


  if (authIsLoading || (!patient && !error && !currentUser)) { 
    return <div className="py-10 flex items-center justify-center"><LoadingSpinner size="lg" /><p className="ml-3 text-white">Loading Patient Details...</p></div>;
  }

  if (error) {
    return <div className="py-10 flex items-center justify-center p-6"><AlertMessage type="error" message={error} /></div>;
  }

  if (!patient) { 
    return <div className="py-10 flex items-center justify-center text-slate-300 p-6">Patient data could not be loaded. Ensure you are logged in as a dentist and the patient ID is correct.</div>;
  }


  return (
    <div className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Patient Info Header */}
        <div className="mb-10 p-6 sm:p-8 bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/80">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div 
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-4xl sm:text-5xl font-bold text-white shadow-xl flex-shrink-0 ring-2 ring-purple-500/70"
              style={getAvatarStyle(patient.avatarSeed)}
              aria-label={`Avatar for ${patient.name}`}
            >
              {patient.name.substring(0, 1).toUpperCase()}
            </div>
            <div className="text-center sm:text-left flex-grow">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-purple-300 tracking-tight mb-1.5">
                {patient.name}
              </h2>
              <div className="space-y-0.5 text-slate-300 text-sm sm:text-base">
                <p><strong className="font-medium text-slate-400">ID:</strong> {patient.id}</p>
                <p><strong className="font-medium text-slate-400">Age:</strong> {patient.age ?? 'N/A'}</p>
                <p><strong className="font-medium text-slate-400">Gender:</strong> {patient.gender && patient.gender !== 'prefer_not_to_say' ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : 'N/A'}</p>
                {patient.phone && (
                  <p><PhoneIconSlim /> <strong className="font-medium text-slate-400">Phone:</strong> {patient.phone}</p>
                )}
                {patient.email && (
                  <p><EmailIconSlim /> <strong className="font-medium text-slate-400">Email:</strong> {patient.email}</p>
                )}
              </div>
               <button
                  onClick={() => setIsEditPatientModalOpen(true)}
                  className="mt-4 inline-flex items-center text-xs text-purple-400 hover:text-purple-300 transition-colors py-1 px-2.5 rounded-md border border-purple-600/70 hover:bg-purple-600/20"
                >
                  <PencilIcon className="w-3 h-3 mr-1.5" /> Edit Details
                </button>
            </div>
            <div className="w-full sm:w-auto flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3 mt-4 sm:mt-0 self-center sm:self-start">
                {analysisHistory.length > 1 && (
                     <button
                        onClick={() => setShowComparisonModal(true)}
                        disabled={analysisHistory.length < 2}
                        className="w-full sm:w-auto flex-shrink-0 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-lg transition-all duration-200 text-sm transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CompareIcon className="w-4 h-4 mr-2" /> Compare X-rays
                    </button>
                )}
                <button
                    onClick={handleAnalyzeNew}
                    className="w-full sm:w-auto flex-shrink-0 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-lg transition-all duration-200 text-sm transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center"
                >
                    <ClipboardDocumentListIcon className="w-4 h-4 mr-2" /> Analyze New X-Ray
                </button>
            </div>
          </div>
        </div>
        
        {/* Medical Notes Section */}
        <div className="mb-12 p-6 sm:p-8 bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/80">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-2xl font-display font-semibold text-purple-400">Medical Notes</h3>
                {!isEditingNotes && (
                    <button 
                        onClick={() => setIsEditingNotes(true)}
                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center transition-colors"
                    >
                        <PencilIcon className="w-4 h-4 mr-1.5" /> Edit Notes
                    </button>
                )}
            </div>
            {notesSuccess && <AlertMessage type="success" message={notesSuccess} onClose={() => setNotesSuccess(null)} className="mb-4" />}
            {notesError && <AlertMessage type="error" message={notesError} onClose={() => setNotesError(null)} className="mb-4" />}

            {isEditingNotes ? (
                <div className="space-y-4">
                    <textarea
                        value={medicalNotesInput}
                        onChange={(e) => setMedicalNotesInput(e.target.value)}
                        rows={6}
                        className="w-full p-3 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow shadow-sm"
                        placeholder="Enter medical notes for this patient..."
                        disabled={isSavingNotes}
                    />
                    <div className="flex justify-end space-x-3">
                        <button 
                            onClick={() => { setIsEditingNotes(false); setMedicalNotesInput(patient.medicalNotes || ''); setNotesError(null); }}
                            disabled={isSavingNotes}
                            className="px-5 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes}
                            className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:bg-slate-500 flex items-center"
                        >
                            {isSavingNotes ? <LoadingSpinner size="sm" /> : 'Save Notes'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-slate-300 whitespace-pre-wrap p-3 bg-slate-700/30 rounded-lg min-h-[80px]">
                    {patient.medicalNotes || <span className="italic text-slate-400">No medical notes recorded yet.</span>}
                </div>
            )}
        </div>
        
        {/* Patient History Section */}
        <HistoryPage patientIdForFilter={patient.id} />
      </div>
      {showComparisonModal && analysisHistory.length > 1 && (
        <XRayComparisonModal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          analysisHistory={analysisHistory}
          patientName={patient.name}
          currentUser={currentUser}
        />
      )}
      {isEditPatientModalOpen && currentUser && patient && (
        <EditPatientModal
            isOpen={isEditPatientModalOpen}
            onClose={() => setIsEditPatientModalOpen(false)}
            patientToEdit={patient}
            onPatientUpdated={handlePatientUpdated}
        />
      )}
    </div>
  );
};