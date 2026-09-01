import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface JobSeekerRegisterPayload {
  email: string;
  password: string;
  fullName: string;
  skills: string;
  experience: string;
  availability: string;
}

export interface EmployerRegisterPayload {
  email: string;
  password: string;
  companyName: string;
  siret: string;
  contactName: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
    fullName?: string;
    companyName?: string;
    verificationStatus?: string;
  };
}

export const apiService = {
  registerJobSeeker: async (payload: JobSeekerRegisterPayload): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register/jobseeker`, payload);
      if (response.data.token) {
        localStorage.setItem('geoemploi_token', response.data.token);
        localStorage.setItem('geoemploi_user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (err: any) {
      if (err.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      if (!err.response) {
        throw new Error('Serveur backend indisponible (hors ligne).');
      }
      throw new Error(err.message || 'Erreur serveur.');
    }
  },

  registerEmployer: async (payload: EmployerRegisterPayload): Promise<AuthResponse> => {
    const siretClean = payload.siret.trim().replace(/\s/g, '');
    if (!/^\d{14}$/.test(siretClean)) {
      throw new Error('Le numéro SIRET doit contenir exactement 14 chiffres.');
    }

    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register/employer`, {
        ...payload,
        siret: siretClean
      });

      if (response.data.token) {
        localStorage.setItem('geoemploi_token', response.data.token);
        localStorage.setItem('geoemploi_user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (err: any) {
      if (err.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      if (!err.response) {
        throw new Error('Serveur backend indisponible (hors ligne).');
      }
      throw new Error(err.message || 'Erreur serveur.');
    }
  }
};
