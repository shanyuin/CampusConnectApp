export type UserRole = "faculty" | "guard";

export type LoginRequest = {
  erpId: string;
  password: string;
  role: UserRole;
};

export type AuthUser = {
  id: string;
  erpId: string;
  name: string;
  role: UserRole;
};

export type LoginResponse = {
  success: true;
  token: string;
  role: UserRole;
  user: AuthUser;
};

export type JwtPayload = {
  sub: string;
  erpId: string;
  name: string;
  role: UserRole;
};
