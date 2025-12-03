import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FormShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  backPath?: string;
  showBackButton?: boolean;
  className?: string;
  footer?: ReactNode;
}

export function FormShell({
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  backPath,
  showBackButton = true,
  className,
  footer,
}: FormShellProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {children}

            <div className="flex items-center justify-between pt-4 border-t">
              {footer || (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      submitLabel
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Reusable form section component
interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// Reusable form row for inline fields
interface FormRowProps {
  children: ReactNode;
  className?: string;
}

export function FormRow({ children, className }: FormRowProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {children}
    </div>
  );
}
