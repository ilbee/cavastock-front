import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import type { Item, HydraCollection } from '../types';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await apiClient.get<HydraCollection<Item>>('/api/items');
      return response.data.member;
    },
  });
}
