import type { DecimalString } from "./common";

export type Role = "OWNER" | "MANAGER";

/** Never includes passwordHash — matches GET /users, /users/me, POST /users, PATCH /users/:id. */
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  commissionPercent: DecimalString;
  baseSalary: DecimalString;
  maxDiscountPercent: DecimalString;
  telegramChatId: string | null;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  fullName: string;
  /** Omit to auto-generate and email a temporary password. */
  password?: string;
  commissionPercent?: number;
  baseSalary?: number;
  maxDiscountPercent?: number;
}

/** PATCH /users/:id — OWNER-only, excludes email/role/password. */
export interface UpdateUserDto {
  fullName?: string;
  commissionPercent?: number;
  baseSalary?: number;
  maxDiscountPercent?: number;
}

/** PATCH /users/me — any role, full name only. */
export interface UpdateOwnProfileDto {
  fullName?: string;
}
