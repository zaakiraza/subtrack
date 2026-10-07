import { z } from "zod";

// RegisterRequest
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// RegisterResponse
export interface RegisterResponse {
  userId: string;
  email: string;
}

// LoginRequest
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// LoginResponse
export interface LoginResponse {
  userId: string;
  role: "USER" | "SUPERADMIN";
}

// PasswordResetRequest
export const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

// PasswordResetConfirm
export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});
export type PasswordResetConfirm = z.infer<typeof PasswordResetConfirmSchema>;

// MessageResponse
export interface MessageResponse {
  message: string;
}
