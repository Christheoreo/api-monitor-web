import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { EmailStep } from "./EmailStep";
import { CodeStep } from "./CodeStep";

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as LocationState | null)?.from?.pathname ?? "/";

  return step === "email" ? (
    <EmailStep
      onCodeSent={(email) => {
        setEmail(email);
        setStep("code");
      }}
    />
  ) : (
    <CodeStep
      email={email}
      onBack={() => setStep("email")}
      onVerified={() => navigate(from, { replace: true })}
    />
  );
}
