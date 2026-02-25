import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../api/items';
import { useContainers } from '../api/containers';
import DataTable, { type Column } from '../components/DataTable';
import { formatPrice } from '../utils/format';
import type { Item, ItemStatus } from '../types';

const statusLabels: Record<ItemStatus, string> = {
  active: 'Active',
  sold_online: 'Sold online',
  sold_offline: 'Sold offline',
  removed: 'Removed',
};

const statusColors: Record<ItemStatus, string> = {
  active: 'bg-green-100 text-green-800',
  sold_online: 'bg-blue-100 text-blue-800',
  sold_offline: 'bg-orange-100 text-orange-800',
  removed: 'bg-gray-100 text-gray-600',
};

const allStatuses: (ItemStatus | 'all')[] = ['all', 'active', 'sold_online', 'sold_offline', 'removed'];

const filterLabels: Record<string, string> = {
  all: 'All',
  ...statusLabels,
};

function extractContainerId(iri: string | null): string | null {
  if (!iri) return null;
  const parts = iri.split('/');
  return parts[parts.length - 1];
}

export default function ItemsPage() {
  const { data: items = [], isLoading: loadingItems } = useItems();
  const { data: containers = [], isLoading: loadingContainers } = useContainers();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');

  const containerLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of containers) {
      map.set(`/api/containers/${c.id}`, c.label);
    }
    return map;
  }, [containers]);

  const isLoading = loadingItems || loadingContainers;

  const filteredItems = statusFilter === 'all'
    ? items
    : items.filter((item) => item.status === statusFilter);

  const columns: Column<Item>[] = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    {
      key: 'priceCents',
      label: 'Price',
      render: (value) => formatPrice(value as number),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const status = value as ItemStatus;
        return (
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        );
      },
    },
    {
      key: 'container',
      label: 'Container',
      render: (value) => {
        const iri = value as string | null;
        const containerId = extractContainerId(iri);
        if (!containerId) return <span className="text-gray-400">&mdash;</span>;
        const label = containerLabels.get(iri!) ?? containerId.slice(0, 8);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/containers/${containerId}`);
            }}
            className="text-purple-600 hover:underline"
          >
            {label}
          </button>
        );
      },
    },
  ];

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading items...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Items</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {allStatuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterLabels[status]}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        searchKeys={['title', 'description']}
        searchPlaceholder="Search by title or description..."
      />
    </div>
  );
}
