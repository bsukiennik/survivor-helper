import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export async function registerJobSeeker(data: any) {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/register/jobseeker`, data);
    return res.data;
  } catch (err: any) {
    if (!err.response) {
      throw new Error('Serveur backend indisponible (hors ligne).');
    }
    throw new Error(err.response?.data?.error || 'Erreur lors de l\'inscription.');
  }
}

export async function registerEmployer(data: any) {
  const siret = data.siret ? data.siret.trim() : '';
  if (siret.length !== 14 || isNaN(Number(siret))) {
    throw new Error('Le numéro SIRET doit contenir exactement 14 chiffres.');
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/register/employer`, { ...data, siret });
    return res.data;
  } catch (err: any) {
    if (!err.response) {
      throw new Error('Serveur backend indisponible (hors ligne).');
    }
    throw new Error(err.response?.data?.error || 'Erreur lors de l\'inscription.');
  }
}
