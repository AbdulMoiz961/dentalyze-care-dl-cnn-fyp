
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole, PatientProfile } from '../types.ts'; 
import {
  apiLogin,
  apiSignup,
  apiGetMe,
  apiUpdateProfile,
  apiGetPatients,
  getToken,
  removeToken,
  type UserResponse,
  type PatientResponse,
} from '../services/serviceService';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, pass: string, roleAttempt: UserRole) => Promise<void>; 
  signup: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (details: Partial<User>) => Promise<void>;
  refreshPatients: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Convert a backend UserResponse + patients list into the frontend User type.
 */
function toFrontendUser(apiUser: UserResponse, patients?: PatientResponse[]): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    companyName: apiUser.company_name || undefined,
    companyLogoBase64: apiUser.company_logo_base64 || undefined,
    patients: patients
      ? patients.map((p) => ({
          id: p.id,
          name: p.name,
          age: p.age,
          gender: p.gender as PatientProfile['gender'],
          phone: p.phone,
          email: p.email,
          avatarSeed: p.avatar_seed,
          medicalNotes: p.medical_notes,
        }))
      : apiUser.role === 'dentist'
        ? []
        : undefined,
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 

  // On mount: check for existing JWT token and restore session
  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const apiUser = await apiGetMe();
        let patients: PatientResponse[] | undefined;
        if (apiUser.role === 'dentist') {
          try {
            patients = await apiGetPatients();
          } catch {
            patients = [];
          }
        }
        setCurrentUser(toFrontendUser(apiUser, patients));
      } catch (error) {
        console.error("Session restoration failed, clearing token:", error);
        removeToken();
        setCurrentUser(null);
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, pass: string, roleAttempt: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiLogin({
        email,
        password: pass,
        role: roleAttempt,
      });

      let patients: PatientResponse[] | undefined;
      if (response.user.role === 'dentist') {
        try {
          patients = await apiGetPatients();
        } catch {
          patients = [];
        }
      }

      setCurrentUser(toFrontendUser(response.user, patients));
    } catch (error: any) {
      console.error("Error during login:", error);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, pass: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiSignup({
        name,
        email,
        password: pass,
        role,
      });

      setCurrentUser(toFrontendUser(response.user));
    } catch (error: any) {
      console.error("Error during signup:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    removeToken();
    setCurrentUser(null);
    setIsLoading(false);
  };

  const updateUserProfile = async (details: Partial<User>): Promise<void> => {
    if (!currentUser) {
      throw new Error("No user logged in to update profile.");
    }
    setIsLoading(true);
    try {
      // Handle profile field updates via API
      const profileUpdate: Record<string, any> = {};
      if (details.name !== undefined) profileUpdate.name = details.name;
      if (details.companyName !== undefined) profileUpdate.company_name = details.companyName;
      if (details.companyLogoBase64 !== undefined) profileUpdate.company_logo_base64 = details.companyLogoBase64;

      // Only call profile API if there are profile-level changes
      if (Object.keys(profileUpdate).length > 0) {
        await apiUpdateProfile(profileUpdate);
      }

      // Re-fetch the full user to get updated data
      const apiUser = await apiGetMe();
      let patients: PatientResponse[] | undefined;
      if (apiUser.role === 'dentist') {
        try {
          patients = await apiGetPatients();
        } catch {
          patients = currentUser.patients ? 
            currentUser.patients.map(p => ({
              id: p.id, name: p.name, age: p.age,
              gender: p.gender || undefined, phone: p.phone,
              email: p.email, avatar_seed: p.avatarSeed,
              medical_notes: p.medicalNotes,
            })) : [];
        }
      }

      // Merge patient list from details if provided (for add/edit/delete patient operations)
      const updatedUser = toFrontendUser(apiUser, patients);
      if (details.patients !== undefined && currentUser.role === 'dentist') {
        updatedUser.patients = details.patients as PatientProfile[];
      }

      setCurrentUser(updatedUser);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPatients = async (): Promise<void> => {
    if (!currentUser || currentUser.role !== 'dentist') return;
    try {
      const patientResponses = await apiGetPatients();
      const updatedPatients: PatientProfile[] = patientResponses.map((p) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender as PatientProfile['gender'],
        phone: p.phone,
        email: p.email,
        avatarSeed: p.avatar_seed,
        medicalNotes: p.medical_notes,
      }));
      setCurrentUser((prev) => (prev ? { ...prev, patients: updatedPatients } : null));
    } catch (e) {
      console.error("Failed to refresh patients:", e);
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    signup,
    logout,
    updateUserProfile,
    refreshPatients,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
