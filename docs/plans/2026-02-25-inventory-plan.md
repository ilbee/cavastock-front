# Inventory Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add inventory browsing with Containers list, Container detail, and Items list pages.

**Architecture:** Three new pages wired into the existing DashboardLayout. A reusable DataTable component handles sort + search. The Axios client gets X-Shop-Id injection. New TanStack Query hooks fetch containers and items.

**Tech Stack:** React 19, TypeScript, TanStack Query v5, React Router v7, Tailwind CSS 4, Vitest + Testing Library.

---

### Task 1: Add X-Shop-Id header to Axios client

**Files:**
- Modify: `src/api/client.ts:11-17`

**Step 1: Add X-Shop-Id to the existing request interceptor**

In `src/api/client.ts`, update the request interceptor to also read `selectedShopId` from localStorage and set `X-Shop-Id`:

```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const shopId = localStorage.getItem('selectedShopId');
  if (shopId) {
    config.headers['X-Shop-Id'] = shopId;
  }
  return config;
});
```

**Step 2: Verify the dev server has no errors**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/api/client.ts
git commit -m "feat: add X-Shop-Id header to API client"
```

---

### Task 2: Add Container and Item types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add the types**

Append to `src/types/index.ts`:

```typescript
export type ItemStatus = 'active' | 'sold_online' | 'sold_offline' | 'removed';

export interface Container {
  id: string;
  label: string;
  locationDescription: string;
  items: string[];
}

export interface Item {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  status: ItemStatus;
  container: string | null;
  platformLinks: string[];
  movementLogs: string[];
}
```

Note: `items`, `container`, `platformLinks`, `movementLogs` are IRI strings from JSON-LD. We store them as strings; we only need the count or the IRI for linking.

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Container and Item types"
```

---

### Task 3: Add formatPrice utility

**Files:**
- Create: `src/utils/format.ts`
- Create: `src/utils/format.test.ts`

**Step 1: Write the failing test**

Create `src/utils/format.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('formats cents to EUR', () => {
    expect(formatPrice(8500)).toBe('85,00\u00a0€');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('0,00\u00a0€');
  });

  it('formats small amounts', () => {
    expect(formatPrice(50)).toBe('0,50\u00a0€');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/format.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `src/utils/format.ts`:

```typescript
const eurFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

export function formatPrice(cents: number): string {
  return eurFormatter.format(cents / 100);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/format.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/utils/format.ts src/utils/format.test.ts
git commit -m "feat: add formatPrice utility"
```

---

### Task 4: Add API hooks for containers and items

**Files:**
- Create: `src/api/containers.ts`
- Create: `src/api/items.ts`

**Step 1: Create containers hooks**

Create `src/api/containers.ts`:

```typescript
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
```

**Step 2: Create items hook**

Create `src/api/items.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import type { Item, HydraCollection } from '../types';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await apiClient.get<HydraCollection<Item>>('/api/items');
      return response.data.member;
    },
  });
}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add src/api/containers.ts src/api/items.ts
git commit -m "feat: add API hooks for containers and items"
```

---

### Task 5: Build DataTable component

**Files:**
- Create: `src/components/DataTable.tsx`
- Create: `src/components/DataTable.test.tsx`

**Step 1: Write the failing test**

Create `src/components/DataTable.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';

interface Fruit {
  id: string;
  name: string;
  count: number;
}

const columns = [
  { key: 'name' as const, label: 'Name' },
  { key: 'count' as const, label: 'Count' },
];

const data: Fruit[] = [
  { id: '1', name: 'Banana', count: 5 },
  { id: '2', name: 'Apple', count: 3 },
  { id: '3', name: 'Cherry', count: 9 },
];

describe('DataTable', () => {
  it('renders all rows', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Cherry')).toBeInTheDocument();
  });

  it('sorts by column on header click', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);
    await user.click(screen.getByText('Name'));
    const rows = screen.getAllByRole('row');
    // header + 3 data rows; first data row should be Apple (asc)
    expect(rows[1]).toHaveTextContent('Apple');
    expect(rows[2]).toHaveTextContent('Banana');
    expect(rows[3]).toHaveTextContent('Cherry');
  });

  it('filters by search text', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={data}
        searchKeys={['name']}
        searchPlaceholder="Search..."
      />,
    );
    await user.type(screen.getByPlaceholderText('Search...'), 'ban');
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });

  it('calls onRowClick when a row is clicked', async () => {
    const user = userEvent.setup();
    let clicked: Fruit | null = null;
    render(
      <DataTable columns={columns} data={data} onRowClick={(row) => { clicked = row; }} />,
    );
    await user.click(screen.getByText('Banana'));
    expect(clicked).toEqual({ id: '1', name: 'Banana', count: 5 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/DataTable.test.tsx`
Expected: FAIL — module not found

**Step 3: Write DataTable implementation**

Create `src/components/DataTable.tsx`:

```tsx
import { useState, useMemo } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T & string;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  searchKeys?: (keyof T & string)[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
}

type SortDir = 'asc' | 'desc';

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  searchKeys,
  searchPlaceholder = 'Search...',
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<(keyof T & string) | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: keyof T & string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    if (!search || !searchKeys?.length) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => String(row[key]).toLowerCase().includes(q)),
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: keyof T & string }) => {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-gray-400" />;
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 inline h-3 w-3" />
      : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  return (
    <div>
      {searchKeys && searchKeys.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 select-none hover:text-gray-700"
                >
                  {col.label}
                  <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sorted.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/DataTable.test.tsx`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/components/DataTable.tsx src/components/DataTable.test.tsx
git commit -m "feat: add reusable DataTable component with sort and search"
```

---

### Task 6: Build ContainersPage

**Files:**
- Create: `src/pages/ContainersPage.tsx`

**Step 1: Create the page**

Create `src/pages/ContainersPage.tsx`:

```tsx
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
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/pages/ContainersPage.tsx
git commit -m "feat: add ContainersPage"
```

---

### Task 7: Build ContainerDetailPage

**Files:**
- Create: `src/pages/ContainerDetailPage.tsx`

**Step 1: Create the page**

Create `src/pages/ContainerDetailPage.tsx`:

```tsx
import { useParams, useNavigate, Link } from 'react-router-dom';
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
        onRowClick={(item) => navigate(`/items?highlight=${item.id}`)}
      />
    </div>
  );
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/pages/ContainerDetailPage.tsx
git commit -m "feat: add ContainerDetailPage"
```

---

### Task 8: Build ItemsPage with status filter

**Files:**
- Create: `src/pages/ItemsPage.tsx`

**Step 1: Create the page**

Create `src/pages/ItemsPage.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { data: items = [], isLoading } = useItems();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');

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
        if (!containerId) return <span className="text-gray-400">—</span>;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/containers/${containerId}`);
            }}
            className="text-purple-600 hover:underline"
          >
            {containerId.slice(0, 8)}...
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
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/pages/ItemsPage.tsx
git commit -m "feat: add ItemsPage with status filters"
```

---

### Task 9: Add navigation links to DashboardLayout

**Files:**
- Modify: `src/layouts/DashboardLayout.tsx`

**Step 1: Add nav links**

Update `src/layouts/DashboardLayout.tsx`. Add imports and a nav bar below the header:

```tsx
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Wine, LayoutDashboard, Box, Tag } from 'lucide-react';
import ShopSwitcher from '../components/ShopSwitcher';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/containers', label: 'Containers', icon: Box },
  { to: '/items', label: 'Items', icon: Tag },
];

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

        <nav className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/layouts/DashboardLayout.tsx
git commit -m "feat: add navigation tabs to DashboardLayout"
```

---

### Task 10: Wire up routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add the new routes**

Update `src/App.tsx` to import and add routes for the three new pages:

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
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up inventory routes"
```

---

### Task 11: Run all tests and verify

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

**Step 2: Run linter**

Run: `npm run lint`
Expected: no errors

**Step 3: Verify in browser**

1. Open http://localhost:5173
2. Log in
3. Click "Containers" tab → see table with BOX-A1, BOX-A2, BOX-B1
4. Click on BOX-A1 → see its items (Lampe Art Déco, Vase Murano)
5. Click "Back to containers" → return to list
6. Click "Items" tab → see all items with prices and status badges
7. Click status pills to filter
8. Type in search box to filter by title
9. Click column headers to sort
