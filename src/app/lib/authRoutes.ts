import type { UserRole } from "../types/auth";

const HOME_BY_ROLE: Record<UserRole, string> = {
  administrador: "/admin/me",
  maestro: "/me/maestro",
  alumno: "/me/alumno",
};

export const getRoleHomePath = (role: UserRole): string => {
  return HOME_BY_ROLE[role];
};