import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface SimplePageProps {
  title: string;
  description: string;
  content?: React.ReactNode;
}

export function SimplePage({ title, description, content }: SimplePageProps) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        
        <div className="rounded-lg border p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">
            {content || `This page is under development. Content for ${title} will appear here.`}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
