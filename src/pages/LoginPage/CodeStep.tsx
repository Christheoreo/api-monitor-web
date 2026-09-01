import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/AuthProvider";
import { requestCode } from "../../lib/api/auth";
import { useCooldown } from "../../features/auth/useCooldown";
import {
  mapVerifyCodeError,
  mapRequestCodeError,
} from "../../lib/api/errorMessages";

interface CodeStepProps {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}

export function CodeStep({ email, onBack, onVerified }: CodeStepProps) {
  const [code, setCode] = useState("");
  const { login } = useAuth();
  const resendCooldown = useCooldown(30);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => login(email, code),
    onSuccess: onVerified,
  });

  const resendMutation = useMutation({
    mutationFn: () => requestCode(email),
    onSuccess: () => resendCooldown.start(),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    verifyMutation.mutate(code);
  };

  return (
    <div>
      <p>We sent a code to {email}</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="code">6-digit code</label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          disabled={verifyMutation.isPending}
          autoFocus
        />
        {verifyMutation.isError && (
          <p role="alert">{mapVerifyCodeError(verifyMutation.error)}</p>
        )}
        <button
          type="submit"
          disabled={verifyMutation.isPending || code.length !== 6}
        >
          {verifyMutation.isPending ? "Verifying..." : "Verify"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => resendMutation.mutate()}
        disabled={resendCooldown.isActive || resendMutation.isPending}
      >
        {resendCooldown.isActive
          ? `Resend in ${resendCooldown.remaining}s`
          : "Resend code"}
      </button>
      {resendMutation.isError && (
        <p role="alert">{mapRequestCodeError(resendMutation.error)}</p>
      )}

      <button type="button" onClick={onBack}>
        Use a different email
      </button>
    </div>
  );
}
