import { useNavigate } from 'react-router-dom';
import { useContainers } from '../api/containers';
import DataTable, { type Column } from '../components/DataTable';
import type { Container } from '../types';

const columns: Column<Container>[] = [
  { key: 'label', label: 'Label' },
  { key: 'locationDescription', label: 'Location' },
  {
    key: 'items',
    label: 'Items',
    render: (value) => String((value as string[]).length),
  },
];

export default function ContainersPage() {
  const { data: containers = [], isLoading } = useContainers();
  const navigate = useNavigate();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading containers...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Containers</h1>
      <DataTable
        columns={columns}
        data={containers}
        searchKeys={['label', 'locationDescription']}
        searchPlaceholder="Search by label or location..."
        onRowClick={(container) => navigate(`/containers/${container.id}`)}
      />
    </div>
  );
}
