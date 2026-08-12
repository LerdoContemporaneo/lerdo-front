import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserLevelSelector from './UserLevelSelector';
import type { UserRole } from '../../types/auth';

const levels = [
  {
    id: 1,
    uuid: 'preescolar',
    nombre: 'Preescolar',
    clave: 'preescolar',
    orden: 1,
    activo: true,
  },
  {
    id: 2,
    uuid: 'primaria',
    nombre: 'Primaria',
    clave: 'primaria',
    orden: 2,
    activo: true,
  },
];

function SelectorHarness({ role }: { role: UserRole }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  return (
    <UserLevelSelector
      role={role}
      levels={levels}
      selectedIds={selectedIds}
      onChange={setSelectedIds}
    />
  );
}

describe('UserLevelSelector', () => {
  it('permite varios niveles para coordinadores', () => {
    render(<SelectorHarness role="coordinador" />);

    const preschool = screen.getByRole('checkbox', { name: /preescolar/i });
    const primary = screen.getByRole('checkbox', { name: /primaria/i });

    fireEvent.click(preschool);
    fireEvent.click(primary);

    expect(preschool).toBeChecked();
    expect(primary).toBeChecked();
  });

  it('mantiene un solo nivel para alumnos', () => {
    render(<SelectorHarness role="alumno" />);

    const preschool = screen.getByRole('radio', { name: /preescolar/i });
    const primary = screen.getByRole('radio', { name: /primaria/i });

    fireEvent.click(preschool);
    fireEvent.click(primary);

    expect(preschool).not.toBeChecked();
    expect(primary).toBeChecked();
  });

  it('no solicita nivel al administrador', () => {
    render(<SelectorHarness role="administrador" />);

    expect(screen.getByText(/acceso global/i)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
