import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from './components/ui/Input';
import '@testing-library/jest-dom';

describe('Input', () => {
  it('renders label and input', () => {
    render(<Input label="Correo" placeholder="tu@correo.com" />);
    expect(screen.getByText('Correo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument();
  });
});
