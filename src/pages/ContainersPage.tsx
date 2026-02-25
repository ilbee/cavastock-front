import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContainers } from '../api/containers';
import DataTable, { type Column } from '../components/DataTable';

interface ContainerRow {
  id: string;
  label: string;
  locationDescription: string;
  itemCount: number;
}

const columns: Column<ContainerRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'locationDescription', label: 'Location' },
  { key: 'itemCount', label: 'Item count' },
];

export default function ContainersPage() {
  const { data: containers = [], isLoading } = useContainers();
  const navigate = useNavigate();

  const rows: ContainerRow[] = useMemo(
    () => containers.map((c) => ({
      id: c.id,
      label: c.label,
      locationDescription: c.locationDescription,
      itemCount: c.items.length,
    })),
    [containers],
  );

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading containers...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Containers</h1>
      <DataTable
        columns={columns}
        data={rows}
        searchKeys={['label', 'locationDescription']}
        searchPlaceholder="Search by label or location..."
        onRowClick={(row) => navigate(`/containers/${row.id}`)}
      />
    </div>
  );
}
