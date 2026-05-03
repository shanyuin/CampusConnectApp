export type UserRole = 'faculty' | 'guard';

export type AuthUser = {
  id: string;
  erpId: string;
  name: string;
  role: UserRole;
};

export type AuthSession = {
  token: string;
  role: UserRole;
  user: AuthUser;
};

export type LoginResponse = {
  success: true;
  token: string;
  role: UserRole;
  user: AuthUser;
};
