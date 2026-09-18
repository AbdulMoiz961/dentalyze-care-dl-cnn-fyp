
import React, { useState } from 'react';
import { PatientProfile, User, PatientGender } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertMessage } from './AlertMessage';
import { apiCreatePatient } from '../services/serviceService';
import { useAuth } from '../contexts/AuthContext';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: (patient: PatientProfile) => void;
  currentUser: User; // Dentist user
  updateUserProfile?: (details: Partial<User>) => Promise<void>;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded,
  currentUser,
}) => {
  const { refreshPatients } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<PatientGender>('prefer_not_to_say');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // Added email state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName(''); setAge(''); setGender('prefer_not_to_say'); setPhone(''); setEmail(''); setError(null); setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Patient name is required."); return; }
    if (currentUser.role !== 'dentist') { setError("Only dentists can add patients."); return; }

    setIsSubmitting(true); setError(null);
    try {
      const created = await apiCreatePatient({
        name: name.trim(),
        age: age === '' ? undefined : Number(age),
        gender: gender,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });

      const newPatient: PatientProfile = {
        id: created.id,
        name: created.name,
        age: created.age,
        gender: (created.gender as PatientProfile['gender']) || 'prefer_not_to_say',
        phone: created.phone,
        email: created.email,
        avatarSeed: created.avatar_seed,
        medicalNotes: created.medical_notes,
      };

      if (refreshPatients) {
        await refreshPatients();
      }
      
      onPatientAdded(newPatient);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error("Error adding patient:", err);
      setError(err.message || "Failed to add patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out" role="dialog" aria-modal="true" aria-labelledby="add-patient-modal-title">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700 transform transition-all duration-300 ease-out scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 id="add-patient-modal-title" className="text-2xl sm:text-3xl font-display font-semibold text-purple-300">
            Add New Patient
          </h2>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} className="mb-5" />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="patient-name" className="block text-sm font-medium text-slate-300 mb-1.5">Patient Full Name <span className="text-red-400">*</span></label>
            <input
              id="patient-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700/60 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., John Doe"
            />
          </div>
          <div>
            <label htmlFor="patient-age" className="block text-sm font-medium text-slate-300 mb-1.5">Age (Optional)</label>
            <input
              id="patient-age" type="number" value={age} onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))} min="0" max="150" disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700/60 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 35"
            />
          </div>
          <div>
            <label htmlFor="patient-gender" className="block text-sm font-medium text-slate-300 mb-1.5">Gender (Optional)</label>
            <select
              id="patient-gender" value={gender} onChange={(e) => setGender(e.target.value as PatientGender)} disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700/60 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
           <div>
            <label htmlFor="patient-phone" className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number (Optional)</label>
            <input
              id="patient-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700/60 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., (123) 456-7890"
            />
          </div>
           <div>
            <label htmlFor="patient-email" className="block text-sm font-medium text-slate-300 mb-1.5">Email Address (Optional)</label>
            <input
              id="patient-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700/60 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., patient@example.com"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <button
              type="button" onClick={() => { resetForm(); onClose(); }} disabled={isSubmitting}
              className="px-6 py-3 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting || !name.trim()}
              className="px-6 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-500 flex items-center justify-center"
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};