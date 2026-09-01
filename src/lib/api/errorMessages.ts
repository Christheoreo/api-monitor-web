import { ApiError } from "./client";

export function mapVerifyCodeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Too many attempts. Wait a bit before trying again.";
    if (error.status === 400) return "That code is invalid or has expired.";
    if (error.status >= 500) return "Something went wrong on our end. Try again shortly.";
  }
  return "Something went wrong. Try again.";
}

export function mapRequestCodeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429)
      return "Too many requests. Wait a bit before requesting another code.";
    if (error.status >= 500) return "Something went wrong on our end. Try again shortly.";
    // Fastify validation 400s land here too (e.g. malformed email that
    // slipped past client-side validation) — generic copy is fine since
    // the client already validates format before this call fires.
  }
  return "Something went wrong. Try again.";
}
