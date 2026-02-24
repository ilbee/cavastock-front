import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import type { Shop, HydraCollection } from '../types';

export function useShops(enabled: boolean) {
  return useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const response = await apiClient.get<HydraCollection<Shop>>('/api/shops');
      return response.data['hydra:member'];
    },
    enabled,
  });
}
