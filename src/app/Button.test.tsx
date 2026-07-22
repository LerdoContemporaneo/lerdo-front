import React from 'react';
import { render, screen } from '@testing-library/react';
import Button from './components/ui/Button';
import '@testing-library/jest-dom';

describe('Button', () => {
  it('renders with primary variant by default', () => {
    render(<Button>Click</Button>);
    const btn = screen.getByRole('button', { name: /click/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('bg-blue-600');
  });

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button', { name: /ghost/i })).toHaveClass('bg-transparent');
  });
});
