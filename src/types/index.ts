export interface User {
  id: string;
  email: string;
}

export interface Shop {
  id: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface HydraCollection<T> {
  'hydra:member': T[];
}
