import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { requestCode } from "../../lib/api/auth";

const emailSchema = z.email();

interface EmailStepProps {
  onCodeSent: (email: string) => void;
}

export function EmailStep({ onCodeSent }: EmailStepProps) {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (email: string) => requestCode(email),
    onSuccess: () => onCodeSent(email),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setValidationError("Enter a valid email address");
      return;
    }
    setValidationError(null);
    mutation.mutate(email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={mutation.isPending}
        autoFocus
      />
      {validationError && <p role="alert">{validationError}</p>}
      {/* Generic on API failure too — no "no account found" messaging, matches backend's no-enumeration behavior */}
      {mutation.isError && <p role="alert">Something went wrong. Try again.</p>}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Sending..." : "Send code"}
      </button>
    </form>
  );
}
