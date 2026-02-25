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
