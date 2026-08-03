export const USER_ROLES = [
  "administrador",
  "maestro",
  "alumno",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AuthUser = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
};