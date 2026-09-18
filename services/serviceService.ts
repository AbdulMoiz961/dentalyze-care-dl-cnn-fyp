/**
 * Dentalyze Care — API Service Layer
 *
 * All backend API calls are centralized here. Replaces the old
 * Gemini proxy service and localStorage-based data management.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

// ─── Token Management ───────────────────────────────────────

const TOKEN_KEY = 'dentalyze_jwt_token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save token:', e);
  }
};

export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Failed to remove token:', e);
  }
};

// ─── HTTP Helpers ────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: any;
  auth?: boolean;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Response is not JSON
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

// ─── Auth API ────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  role: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  company_name?: string;
  company_logo_base64?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  company_name?: string;
  company_logo_base64?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export const apiLogin = async (data: LoginRequest): Promise<TokenResponse> => {
  const result = await apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: data,
    auth: false,
  });
  setToken(result.access_token);
  return result;
};

export const apiSignup = async (data: SignupRequest): Promise<TokenResponse> => {
  const result = await apiRequest<TokenResponse>('/auth/signup', {
    method: 'POST',
    body: data,
    auth: false,
  });
  setToken(result.access_token);
  return result;
};

export const apiGetMe = async (): Promise<UserResponse> => {
  return apiRequest<UserResponse>('/auth/me');
};

export const apiUpdateProfile = async (data: ProfileUpdateRequest): Promise<UserResponse> => {
  return apiRequest<UserResponse>('/auth/profile', {
    method: 'PUT',
    body: data,
  });
};

// ─── Patient API ─────────────────────────────────────────────

export interface PatientCreateRequest {
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  medical_notes?: string;
}

export interface PatientUpdateRequest {
  name?: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  medical_notes?: string;
}

export interface PatientResponse {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  avatar_seed: string;
  medical_notes?: string;
}

export const apiGetPatients = async (): Promise<PatientResponse[]> => {
  return apiRequest<PatientResponse[]>('/patients/');
};

export const apiGetPatient = async (id: string): Promise<PatientResponse> => {
  return apiRequest<PatientResponse>(`/patients/${id}`);
};

export const apiCreatePatient = async (data: PatientCreateRequest): Promise<PatientResponse> => {
  return apiRequest<PatientResponse>('/patients/', {
    method: 'POST',
    body: data,
  });
};

export const apiUpdatePatient = async (id: string, data: PatientUpdateRequest): Promise<PatientResponse> => {
  return apiRequest<PatientResponse>(`/patients/${id}`, {
    method: 'PUT',
    body: data,
  });
};

export const apiDeletePatient = async (id: string): Promise<void> => {
  return apiRequest<void>(`/patients/${id}`, { method: 'DELETE' });
};

// ─── Analysis API ────────────────────────────────────────────

export interface AnalyzeRequest {
  imageBase64: string;
  mimeType: string;
  patientId?: string;
  useFallback?: boolean;
}

export type { DetectedConditionReport, ParsedAnalysisReport, AnalysisHistoryItem } from '../types';
import type { ParsedAnalysisReport, AnalysisHistoryItem } from '../types';

export interface AnalyzeResponse {
  report: ParsedAnalysisReport;
  analysisId: string;
  method: string;
}

export interface AnalysisHistoryListResponse {
  items: AnalysisHistoryItem[];
  total: number;
  page: number;
  per_page: number;
}

export const apiAnalyzeXray = async (data: AnalyzeRequest): Promise<AnalyzeResponse> => {
  return apiRequest<AnalyzeResponse>('/analysis/analyze', {
    method: 'POST',
    body: data,
  });
};

export const apiGetHistory = async (
  page: number = 1,
  perPage: number = 20,
  patientId?: string
): Promise<AnalysisHistoryListResponse> => {
  let url = `/analysis/history?page=${page}&per_page=${perPage}`;
  if (patientId) {
    url += `&patient_id=${patientId}`;
  }
  return apiRequest<AnalysisHistoryListResponse>(url);
};

export const apiGetAnalysis = async (id: string): Promise<AnalysisHistoryItem> => {
  return apiRequest<AnalysisHistoryItem>(`/analysis/history/${id}`);
};

export const apiDeleteAnalysis = async (id: string): Promise<void> => {
  return apiRequest<void>(`/analysis/history/${id}`, { method: 'DELETE' });
};

// ─── Health Check ────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  app: string;
  cnn_model_loaded: boolean;
  gemini_configured: boolean;
}

export const apiHealthCheck = async (): Promise<HealthResponse> => {
  return apiRequest<HealthResponse>('/health', { auth: false });
};
