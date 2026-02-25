import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ShopProvider } from './contexts/ShopContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContainersPage from './pages/ContainersPage';
import ContainerDetailPage from './pages/ContainerDetailPage';
import ItemsPage from './pages/ItemsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ShopProvider>
            <Routes>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/containers" element={<ContainersPage />} />
                  <Route path="/containers/:id" element={<ContainerDetailPage />} />
                  <Route path="/items" element={<ItemsPage />} />
                </Route>
              </Route>
            </Routes>
          </ShopProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
