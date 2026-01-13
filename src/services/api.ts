import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🔗 API URL configurada:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para debug
api.interceptors.request.use(
  (config) => {
    console.log(`➡️ Fazendo requisição: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Resposta recebida de ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Servidor não está respondendo. Verifique se o backend está rodando.');
    }
    return Promise.reject(error);
  }
);

// Tipos
export interface User {
  id: number;
  nome: string;
  avatar_url: string | null;
  titulo_engracado: string | null;
}

export interface Meal {
  id: number;
  data: string;
  tipo_refeicao: 'cafe' | 'almoco' | 'jantar';
  nome_refeicao?: string;
  ingredientes: string[];
  cook_id: number | null;
  helper_id: number | null;
  dishwasher1_id: number | null;
  dishwasher2_id: number | null;
  cook_nome?: string;
  cook_avatar?: string;
  helper_nome?: string;
  helper_avatar?: string;
  dishwasher1_nome?: string;
  dishwasher1_avatar?: string;
  dishwasher2_nome?: string;
  dishwasher2_avatar?: string;
}

export interface Drink {
  id: number;
  categoria: 'alc' | 'non-alc';
  nome_bebida: string;
  votos: number;
}

export interface ChecklistItem {
  id: number;
  categoria: 'item' | 'tarefa' | 'nao_esqueca';
  descricao: string;
  owner_id: number | null;
  completed: boolean;
  owner_nome?: string;
  owner_avatar?: string;
}

export interface Experience {
  id: number;
  tipo: 'frase' | 'tema_festa';
  conteudo: string;
  autor_id: number | null;
  votos: number;
  autor_nome?: string;
  autor_avatar?: string;
}

// API Calls - Users
export const getUsers = async () => {
  const response = await api.get<{ success: boolean; data: User[] }>('/users');
  return response.data.data;
};

export const getUserById = async (id: number) => {
  const response = await api.get<{ success: boolean; data: User }>(`/users/${id}`);
  return response.data.data;
};

export const createUser = async (userData: { nome: string; avatar_url?: string; titulo_engracado?: string }) => {
  const response = await api.post<{ success: boolean; data: User }>('/users', userData);
  return response.data.data;
};

export const updateUser = async (id: number, userData: Partial<User>) => {
  const response = await api.patch<{ success: boolean; data: User }>(`/users/${id}`, userData);
  return response.data.data;
};

// API Calls - Meals
export const getMeals = async () => {
  const response = await api.get<{ success: boolean; data: Meal[] }>('/meals');
  return response.data.data;
};

export const getMealById = async (id: number) => {
  const response = await api.get<{ success: boolean; data: Meal }>(`/meals/${id}`);
  return response.data.data;
};

export const createMeal = async (mealData: {
  data: string;
  tipo_refeicao: 'cafe' | 'almoco' | 'jantar';
  ingredientes?: string[];
  cook_id?: number;
  dishwasher1_id?: number;
  dishwasher2_id?: number;
}) => {
  const response = await api.post<{ success: boolean; data: Meal }>('/meals', mealData);
  return response.data.data;
};

export const claimMealRole = async (mealId: number, role: 'cook' | 'helper' | 'dishwasher1' | 'dishwasher2', userId: number) => {
  const response = await api.patch<{ success: boolean; data: Meal }>('/meals/claim-role', {
    meal_id: mealId,
    role,
    user_id: userId,
  });
  return response.data.data;
};

// API Calls - Drinks
export const getDrinks = async () => {
  const response = await api.get<{ success: boolean; data: Drink[] }>('/drinks');
  return response.data.data;
};

export const getDrinksByCategory = async (category: 'alc' | 'non-alc') => {
  const response = await api.get<{ success: boolean; data: Drink[] }>(`/drinks/category/${category}`);
  return response.data.data;
};

export const createDrink = async (drinkData: { categoria: 'alc' | 'non-alc'; nome_bebida: string }) => {
  const response = await api.post<{ success: boolean; data: Drink }>('/drinks', drinkData);
  return response.data.data;
};

export const voteDrink = async (drinkId: number) => {
  const response = await api.post<{ success: boolean; data: Drink }>('/drinks/vote', { drink_id: drinkId });
  return response.data.data;
};

// API Calls - Checklist
export const getChecklist = async () => {
  const response = await api.get<{ success: boolean; data: ChecklistItem[] }>('/checklist');
  return response.data.data;
};

export const getChecklistByCategory = async (category: 'item' | 'tarefa' | 'nao_esqueca') => {
  const response = await api.get<{ success: boolean; data: ChecklistItem[] }>(`/checklist/category/${category}`);
  return response.data.data;
};

export const createChecklistItem = async (itemData: {
  categoria: 'item' | 'tarefa' | 'nao_esqueca';
  descricao: string;
  owner_id?: number;
}) => {
  const response = await api.post<{ success: boolean; data: ChecklistItem }>('/checklist', itemData);
  return response.data.data;
};

export const updateChecklistItem = async (id: number, itemData: Partial<ChecklistItem>) => {
  const response = await api.patch<{ success: boolean; data: ChecklistItem }>(`/checklist/${id}`, itemData);
  return response.data.data;
};

export const deleteChecklistItem = async (id: number) => {
  const response = await api.delete<{ success: boolean }>(`/checklist/${id}`);
  return response.data;
};

export const claimChecklistItem = async (id: number, userId: number) => {
  const response = await api.patch<{ success: boolean; data: ChecklistItem }>(`/checklist/${id}/claim`, {
    user_id: userId,
  });
  return response.data.data;
};

// API Calls - Experience
export const getExperiences = async () => {
  const response = await api.get<{ success: boolean; data: Experience[] }>('/experience');
  return response.data.data;
};

export const getExperiencesByType = async (type: 'frase' | 'tema_festa') => {
  const response = await api.get<{ success: boolean; data: Experience[] }>(`/experience/type/${type}`);
  return response.data.data;
};

export const createExperience = async (experienceData: {
  tipo: 'frase' | 'tema_festa';
  conteudo: string;
  autor_id?: number;
}) => {
  const response = await api.post<{ success: boolean; data: Experience }>('/experience', experienceData);
  return response.data.data;
};

export const voteExperience = async (experienceId: number) => {
  const response = await api.post<{ success: boolean; data: Experience }>('/experience/vote', {
    experience_id: experienceId,
  });
  return response.data.data;
};

export default api;
