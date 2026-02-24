import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Wine } from 'lucide-react';
import ShopSwitcher from '../components/ShopSwitcher';

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Wine className="h-6 w-6 text-purple-600" />
            <span className="text-lg font-semibold text-gray-900">CavaScan Admin</span>
          </div>

          <div className="flex items-center gap-6">
            <ShopSwitcher />

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
