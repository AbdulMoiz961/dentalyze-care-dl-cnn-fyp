
export interface AnalysisResult {
  text: string;
  // Potentially add structured data if the model can provide it and it's parsed
}

export interface DentalCondition {
  id: string;
  name: string;
  description: string;
  imageUrl?: string; // Placeholder for potential condition images
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatarUrl?: string;
}

export interface DetectedConditionReport {
  conditionName: string;
  location?: string;
  severity?: string;
  description: string;
  box?: [number, number, number, number]; // [x1, y1, x2, y2]
  confidence?: number;
  classId?: number;
  color?: string;
}

export interface ParsedAnalysisReport {
  imageQuality?: string;
  summary?: string;
  detectedConditions: DetectedConditionReport[];
  recommendations?: string;
  imageDimensions?: {
    width: number;
    height: number;
  };
}

export type UserRole = 'patient' | 'dentist';

export type PatientGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface PatientProfile {
  id: string; // Unique ID for the patient
  name: string;
  age?: number;
  gender?: PatientGender;
  phone?: string; // Optional phone number
  email?: string; // Optional email address
  avatarSeed: string; // Used for generating a consistent placeholder avatar
  medicalNotes?: string; // For dentists to add notes about the patient
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole; 
  companyName?: string;
  companyLogoBase64?: string; 
  patients?: PatientProfile[]; 
}

export interface AnalysisHistoryItem {
  id: string; 
  date: string; 
  imageMimeType?: string | null; 
  imageBase64?: string | null; 
  report: ParsedAnalysisReport; 
  patientId?: string; 
  method?: string;
}

export type AnalysisContextType = 'new' | 'existing_patient' | 'new_patient_for_analysis';