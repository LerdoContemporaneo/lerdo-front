import React from 'react';
import { render, screen } from '@testing-library/react';
import { Table } from './components/ui/Table';
import '@testing-library/jest-dom';

const columns = [{ key: 'name', header: 'Name' }];
const data = [{ name: 'Alice' }];

describe('Table', () => {
  it('renders headers and rows', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(<Table columns={columns} data={[]} />);
    expect(screen.getByText(/No se encontraron registros/i)).toBeInTheDocument();
  });
});
