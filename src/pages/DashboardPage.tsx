import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { selectedShop } = useShop();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome, {user?.email}. Currently viewing shop:{' '}
        <strong>{selectedShop?.name ?? 'None selected'}</strong>.
      </p>
    </div>
  );
}
