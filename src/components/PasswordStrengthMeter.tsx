import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

interface Criterion {
  label: string;
  test: (pw: string) => boolean;
}

const CRITERIA: Criterion[] = [
  { label: "8+ characters", test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Number", test: (pw) => /[0-9]/.test(pw) },
  {
    label: "Special character",
    test: (pw) => /[!@#$%^&*()_+\-=]/.test(pw),
  },
];

const LEVELS = [
  { max: 1, label: "Weak", color: "text-destructive", barColor: "bg-destructive" },
  { max: 3, label: "Fair", color: "text-amber-400", barColor: "bg-amber-400" },
  { max: 4, label: "Good", color: "text-blue-400", barColor: "bg-blue-400" },
  { max: 5, label: "Strong", color: "text-emerald-400", barColor: "bg-emerald-400" },
] as const;

export function getPasswordCriteriaMet(password: string): boolean[] {
  return CRITERIA.map((c) => c.test(password));
}

export function isPasswordValid(password: string): boolean {
  return CRITERIA.every((c) => c.test(password));
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const results = useMemo(() => getPasswordCriteriaMet(password), [password]);
  const met = results.filter(Boolean).length;

  const level = LEVELS.find((l) => met <= l.max) ?? LEVELS[LEVELS.length - 1];
  const pct = (met / CRITERIA.length) * 100;

  if (!password) return null;

  return (
    <div className="space-y-3 pt-1">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Strength</span>
          <span className={`font-medium ${level.color}`}>{level.label}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${level.barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Criteria checklist */}
      <ul className="space-y-1">
        {CRITERIA.map((criterion, i) => (
          <li
            key={criterion.label}
            className={`flex items-center gap-2 text-xs transition-colors ${
              results[i] ? "text-emerald-400" : "text-muted-foreground"
            }`}
          >
            {results[i] ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0" />
            )}
            {criterion.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
