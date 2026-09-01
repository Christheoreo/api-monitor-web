import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/AuthProvider";
import { requestCode } from "../../lib/api/auth";
import { useCooldown } from "../../features/auth/useCooldown";
import { mapVerifyCodeError, mapRequestCodeError } from "../../lib/api/errorMessages";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

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
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">We sent a code to {email}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="code" className="text-sm font-medium">
            6-digit code
          </label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={verifyMutation.isPending}
            autoFocus
            className="text-center text-lg tracking-[0.5em]"
            placeholder="000000"
          />
        </div>
        {verifyMutation.isError && (
          <p role="alert" className="text-sm text-down-text">
            {mapVerifyCodeError(verifyMutation.error)}
          </p>
        )}
        <Button
          type="submit"
          disabled={verifyMutation.isPending || code.length !== 6}
          className="w-full"
        >
          {verifyMutation.isPending ? "Verifying..." : "Verify"}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-text-secondary hover:text-white">
          Use a different email
        </button>
        <button
          type="button"
          onClick={() => resendMutation.mutate()}
          disabled={resendCooldown.isActive || resendMutation.isPending}
          className="text-brand hover:text-brand-hover disabled:text-text-secondary disabled:opacity-50"
        >
          {resendCooldown.isActive ? `Resend in ${resendCooldown.remaining}s` : "Resend code"}
        </button>
      </div>
      {resendMutation.isError && (
        <p role="alert" className="text-sm text-down-text">
          {mapRequestCodeError(resendMutation.error)}
        </p>
      )}
    </div>
  );
}
