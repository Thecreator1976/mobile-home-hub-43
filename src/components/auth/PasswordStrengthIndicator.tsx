import { useEffect, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validatePassword,
  checkPasswordAgainstBreaches,
  getStrengthLabel,
  getStrengthColor,
  type PasswordValidationResult,
} from "@/utils/passwordValidation";

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange?: (isValid: boolean) => void;
  checkBreaches?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  onValidationChange,
  checkBreaches = true,
}: PasswordStrengthIndicatorProps) {
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);
  const [isCheckingBreaches, setIsCheckingBreaches] = useState(false);
  const [isBreached, setIsBreached] = useState(false);

  const checkPassword = useCallback(async () => {
    if (!password) {
      setValidation(null);
      setIsBreached(false);
      onValidationChange?.(false);
      return;
    }

    // Local validation
    const localValidation = validatePassword(password);
    setValidation(localValidation);

    // Check against breaches if enabled and password looks valid
    if (checkBreaches && localValidation.isValid && password.length >= 8) {
      setIsCheckingBreaches(true);
      try {
        const breached = await checkPasswordAgainstBreaches(password);
        setIsBreached(breached);
        onValidationChange?.(!breached && localValidation.isValid);
      } catch {
        setIsBreached(false);
        onValidationChange?.(localValidation.isValid);
      } finally {
        setIsCheckingBreaches(false);
      }
    } else {
      setIsBreached(false);
      onValidationChange?.(localValidation.isValid);
    }
  }, [password, checkBreaches, onValidationChange]);

  useEffect(() => {
    // Debounce the check
    const timer = setTimeout(checkPassword, 300);
    return () => clearTimeout(timer);
  }, [checkPassword]);

  if (!password || !validation) {
    return null;
  }

  const isValid = validation.isValid && !isBreached;
  const strengthPercent = ((validation.score + 1) / 5) * 100;

  return (
    <div
      className={cn(
        "mt-2 p-3 rounded-lg border transition-colors",
        isValid
          ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
          : "bg-destructive/5 border-destructive/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          {/* Status Header */}
          <div className="flex items-center gap-2">
            {isCheckingBreaches ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isBreached ? (
              <ShieldAlert className="h-4 w-4 text-destructive" />
            ) : isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <span
              className={cn(
                "font-medium text-sm",
                isValid ? "text-green-700 dark:text-green-400" : "text-destructive"
              )}
            >
              {isCheckingBreaches
                ? "Checking security..."
                : isBreached
                ? "Password found in data breach!"
                : isValid
                ? getStrengthLabel(validation.score)
                : getStrengthLabel(validation.score)}
            </span>
          </div>

          {/* Strength Meter */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                isBreached ? "bg-destructive" : getStrengthColor(validation.score)
              )}
              style={{ width: `${isBreached ? 100 : strengthPercent}%` }}
            />
          </div>

          {/* Feedback */}
          {(validation.feedback || isBreached) && (
            <p className="text-sm text-muted-foreground">
              {isBreached
                ? "This password has appeared in known data breaches. Please choose a different one."
                : validation.feedback}
            </p>
          )}

          {/* Suggestions */}
          {validation.suggestions.length > 0 && !isBreached && (
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {validation.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-center gap-1">
                  <span className="text-muted-foreground">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
