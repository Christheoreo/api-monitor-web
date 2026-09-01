import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { requestCode } from "../../lib/api/auth";
import { mapRequestCodeError } from "../../lib/api/errorMessages";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mutation.isPending}
          autoFocus
          placeholder="you@example.com"
        />
      </div>
      {validationError && (
        <p role="alert" className="text-sm text-down-text">
          {validationError}
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="text-sm text-down-text">
          {mapRequestCodeError(mutation.error)}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Sending..." : "Send code"}
      </Button>
    </form>
  );
}
