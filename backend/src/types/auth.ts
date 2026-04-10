export type LoginRequest = {
  erpId: string;
  password: string;
};

export type AuthUser = {
  id: string;
  erpId: string;
  name: string;
  role: string | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type JwtPayload = {
  sub: string;
  erpId: string;
  name: string;
  role: string | null;
};
