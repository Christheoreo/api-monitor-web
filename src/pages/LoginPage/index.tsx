import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { EmailStep } from "./EmailStep";
import { CodeStep } from "./CodeStep";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as LocationState | null)?.from?.pathname ?? "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand font-bold text-white">
            P
          </div>
          <span className="text-lg font-bold text-white">Pulse</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === "email" ? "Sign in" : "Enter your code"}</CardTitle>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
