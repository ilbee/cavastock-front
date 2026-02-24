import { useShop } from '../contexts/ShopContext';
import { Store } from 'lucide-react';

export default function ShopSwitcher() {
  const { shops, selectedShop, selectShop, isLoading } = useShop();

  if (isLoading) {
    return <span className="text-sm text-gray-400">Loading shops...</span>;
  }

  if (shops.length === 0) {
    return <span className="text-sm text-gray-400">No shops available</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Store className="h-4 w-4 text-gray-400" />
      <select
        value={selectedShop?.id ?? ''}
        onChange={(e) => selectShop(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
          </option>
        ))}
      </select>
    </div>
  );
}
