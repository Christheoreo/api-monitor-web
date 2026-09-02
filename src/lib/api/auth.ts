import { z } from "zod";
import { apiFetch } from "./client";

export const userSchema = z.object({
  id: z.uuid(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.email(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
});

export type User = z.infer<typeof userSchema>;

export function requestCode(email: string) {
  return apiFetch<{ message: string }>("/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuth: true,
  });
}

export function verifyCode(email: string, code: string) {
  return apiFetch<{ accessToken: string }>("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
    skipAuth: true,
  });
}

export function logout() {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export async function fetchCurrentUser(): Promise<User> {
  const raw = await apiFetch<unknown>("/auth/user");
  return userSchema.parse(raw); // runtime validation, not just a type cast
}
