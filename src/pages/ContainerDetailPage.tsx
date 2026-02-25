import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useContainer } from '../api/containers';
import { useItems } from '../api/items';
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
];

export default function ContainerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: container, isLoading: loadingContainer } = useContainer(id!);
  const { data: allItems = [], isLoading: loadingItems } = useItems();

  const containerIri = `/api/containers/${id}`;
  const items = allItems.filter((item) => item.container === containerIri);

  if (loadingContainer || loadingItems) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  if (!container) {
    return <p className="text-sm text-red-500">Container not found.</p>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/containers')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to containers
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{container.label}</h1>
        <p className="mt-1 text-gray-600">{container.locationDescription}</p>
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchKeys={['title', 'description']}
        searchPlaceholder="Search items..."
      />
    </div>
  );
}
