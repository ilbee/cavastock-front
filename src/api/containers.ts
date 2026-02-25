import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import type { Container, HydraCollection } from '../types';

export function useContainers() {
  return useQuery({
    queryKey: ['containers'],
    queryFn: async () => {
      const response = await apiClient.get<HydraCollection<Container>>('/api/containers');
      return response.data.member;
    },
  });
}

export function useContainer(id: string) {
  return useQuery({
    queryKey: ['containers', id],
    queryFn: async () => {
      const response = await apiClient.get<Container>(`/api/containers/${id}`);
      return response.data;
    },
  });
}
