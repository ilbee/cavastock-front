# CavaScan Admin — Initial Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bootstrap a Vite + React + TypeScript + Tailwind SPA with JWT authentication, shop switching, and an empty dashboard.

**Architecture:** Client-side SPA with React Router for routing, AuthContext/ShopContext for state, Axios interceptors for JWT, TanStack Query for server state. API at `http://localhost:60080`.

**Tech Stack:** React 19, TypeScript (strict), Vite, Tailwind CSS 4, React Router v7, TanStack Query v5, Axios, Lucide React, clsx.

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: all Vite scaffold files (via `npm create vite`)
- Modify: `tsconfig.json` (strict mode)

**Step 1: Create Vite project in current directory**

Run:
```bash
cd /Users/j.prigent/Public/perso/cavascan/cavascan-front
npm create vite@latest . -- --template react-ts
```

Note: This will scaffold into the existing directory. Say yes if prompted about non-empty dir.

**Step 2: Install base dependencies**

Run:
```bash
npm install
```

**Step 3: Verify it works**

Run:
```bash
npm run dev -- --port 5173 &
sleep 3
curl -s http://localhost:5173 | head -5
kill %1
```

Expected: HTML response with `<div id="root">`.

**Step 4: Clean up scaffold files**

Delete these files (we'll replace them):
- `src/App.css`
- `src/index.css`
- `src/App.tsx` (will rewrite)
- `src/assets/react.svg`
- `public/vite.svg`

**Step 5: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Install Tailwind CSS 4

**Files:**
- Modify: `src/index.css`
- Modify: `vite.config.ts`

**Step 1: Install Tailwind CSS v4 + Vite plugin**

Run:
```bash
npm install tailwindcss @tailwindcss/vite
```

**Step 2: Configure Vite plugin**

Write `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

**Step 3: Create `src/index.css`**

```css
@import "tailwindcss";
```

**Step 4: Verify Tailwind works**

Write a minimal `src/App.tsx`:
```tsx
function App() {
  return <h1 className="text-3xl font-bold text-blue-600">Tailwind works</h1>
}
export default App
```

Run dev server, check that styles apply (blue bold text).

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure Tailwind CSS 4 with Vite plugin"
```

---

### Task 3: Install project dependencies + Makefile + .env

**Files:**
- Create: `Makefile`
- Create: `.env`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Install all project dependencies**

Run:
```bash
npm install @tanstack/react-query axios react-router-dom lucide-react clsx
```

**Step 2: Create `.env` and `.env.example`**

`.env`:
```
VITE_API_URL=http://localhost:60080
```

`.env.example`:
```
VITE_API_URL=http://localhost:60080
```

**Step 3: Add `.env` to `.gitignore`**

Append to `.gitignore`:
```
.env
```

**Step 4: Create `Makefile`**

```makefile
.PHONY: init dev build lint

init:
	npm install
	@if [ ! -f .env ]; then cp .env.example .env; echo ".env created from .env.example"; fi

dev:
	npm run dev

build:
	npm run build

lint:
	npx eslint src/
```

**Step 5: Verify Makefile**

Run:
```bash
make init
make lint
```

Expected: No errors.

**Step 6: Commit**

```bash
git add Makefile .env.example .gitignore package.json package-lock.json
git commit -m "chore: add dependencies, Makefile, and env configuration"
```

---

### Task 4: Create directory structure and TypeScript types

**Files:**
- Create: `src/api/` (directory)
- Create: `src/components/` (directory)
- Create: `src/contexts/` (directory)
- Create: `src/layouts/` (directory)
- Create: `src/pages/` (directory)
- Create: `src/types/index.ts`
- Create: `src/utils/` (directory)

**Step 1: Create all directories**

Run:
```bash
mkdir -p src/{api,components,contexts,layouts,pages,types,utils}
```

**Step 2: Create TypeScript types**

Write `src/types/index.ts`:
```ts
export interface User {
  id: string;
  email: string;
}

export interface Shop {
  id: string;
  name: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: create directory structure and TypeScript types"
```

---

### Task 5: Configure Axios client with interceptors

**Files:**
- Create: `src/api/client.ts`

**Step 1: Write the Axios client**

Write `src/api/client.ts`:
```ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/ld+json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('selectedShopId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

**Step 2: Verify it compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/api/client.ts
git commit -m "feat: add Axios client with JWT and 401 interceptors"
```

---

### Task 6: Create AuthContext

**Files:**
- Create: `src/contexts/AuthContext.tsx`

**Step 1: Write AuthContext**

Write `src/contexts/AuthContext.tsx`:
```tsx
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import apiClient from '../api/client';
import type { User, LoginCredentials } from '../types';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.sub ?? payload.uuid, email: payload.username ?? payload.email });
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await apiClient.post<{ token: string }>('/api/login', credentials);
    const newToken = response.data.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedShopId');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Step 2: Verify it compiles**

Run:
```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: add AuthContext with login/logout and JWT decoding"
```

---

### Task 7: Create ShopContext

**Files:**
- Create: `src/contexts/ShopContext.tsx`
- Create: `src/api/shops.ts`

**Step 1: Write the shops API hook**

Write `src/api/shops.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import type { Shop } from '../types';

interface HydraCollection<T> {
  'hydra:member': T[];
}

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
```

**Step 2: Write ShopContext**

Write `src/contexts/ShopContext.tsx`:
```tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useShops } from '../api/shops';
import { useAuth } from './AuthContext';
import type { Shop } from '../types';

interface ShopContextValue {
  shops: Shop[];
  selectedShop: Shop | null;
  selectShop: (shopId: string) => void;
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: shops = [], isLoading } = useShops(isAuthenticated);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(
    () => localStorage.getItem('selectedShopId'),
  );

  const selectedShop = shops.find((s) => s.id === selectedShopId) ?? shops[0] ?? null;

  useEffect(() => {
    if (shops.length > 0 && !selectedShopId) {
      setSelectedShopId(shops[0].id);
      localStorage.setItem('selectedShopId', shops[0].id);
    }
  }, [shops, selectedShopId]);

  const selectShop = useCallback((shopId: string) => {
    setSelectedShopId(shopId);
    localStorage.setItem('selectedShopId', shopId);
  }, []);

  return (
    <ShopContext.Provider value={{ shops, selectedShop, selectShop, isLoading }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
```

**Step 3: Verify it compiles**

Run:
```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/api/shops.ts src/contexts/ShopContext.tsx
git commit -m "feat: add ShopContext with shop fetching and switching"
```

---

### Task 8: Create layouts and pages

**Files:**
- Create: `src/layouts/AuthLayout.tsx`
- Create: `src/layouts/DashboardLayout.tsx`
- Create: `src/components/ShopSwitcher.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/DashboardPage.tsx`

**Step 1: Write ProtectedRoute**

Write `src/components/ProtectedRoute.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

**Step 2: Write ShopSwitcher**

Write `src/components/ShopSwitcher.tsx`:
```tsx
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
```

**Step 3: Write AuthLayout**

Write `src/layouts/AuthLayout.tsx`:
```tsx
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
```

**Step 4: Write DashboardLayout**

Write `src/layouts/DashboardLayout.tsx`:
```tsx
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
```

**Step 5: Write LoginPage**

Write `src/pages/LoginPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wine } from 'lucide-react';
import clsx from 'clsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch {
      setError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex flex-col items-center">
        <Wine className="mb-2 h-10 w-10 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900">CavaScan Admin</h1>
        <p className="text-sm text-gray-500">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="alice@cavascan.dev"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            'w-full rounded-md px-4 py-2 text-sm font-medium text-white',
            isLoading
              ? 'cursor-not-allowed bg-purple-400'
              : 'bg-purple-600 hover:bg-purple-700',
          )}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
```

**Step 6: Write DashboardPage**

Write `src/pages/DashboardPage.tsx`:
```tsx
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
```

**Step 7: Verify it compiles**

Run:
```bash
npx tsc --noEmit
```

**Step 8: Commit**

```bash
git add src/layouts/ src/components/ src/pages/
git commit -m "feat: add layouts, pages, and UI components"
```

---

### Task 9: Wire up App with Router and Providers

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: Write `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ShopProvider } from './contexts/ShopContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

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
                </Route>
              </Route>
            </Routes>
          </ShopProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

**Step 2: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Step 3: Verify full app compiles and runs**

Run:
```bash
npx tsc --noEmit
npm run dev
```

Visit `http://localhost:5173` — should redirect to `/login`.

**Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: wire up router, providers, and app entry point"
```

---

### Task 10: End-to-end verification

**Step 1: Start the API**

Make sure cavascan-api is running on port 60080.

**Step 2: Test login flow**

1. Visit `http://localhost:5173` — should redirect to `/login`
2. Enter `alice@cavascan.dev` / `password` — should redirect to `/`
3. Dashboard should show user email and shop name in header
4. Shop switcher should list available shops
5. Switch shops — dashboard text should update
6. Click Logout — should return to `/login`
7. Visit `http://localhost:5173/` directly while logged out — should redirect to `/login`

**Step 3: Final commit if any adjustments were needed**

```bash
git add -A
git commit -m "chore: final adjustments after e2e verification"
```
