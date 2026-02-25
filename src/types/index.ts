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
  member: T[];
}

export type ItemStatus = 'active' | 'sold_online' | 'sold_offline' | 'removed';

export interface Container {
  id: string;
  label: string;
  locationDescription: string;
  items: string[];
}

export interface Item {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  status: ItemStatus;
  container: string | null;
  platformLinks: string[];
  movementLogs: string[];
}
