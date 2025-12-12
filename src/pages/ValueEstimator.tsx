import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

export default function ValueEstimator() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Value Estimator</h1>
            <p className="text-muted-foreground">Estimate property values and potential offers</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Value Calculator</CardTitle>
            <CardDescription>Enter property details to get an estimated value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex flex-col items-center justify-center">
              <Calculator className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Value Estimator Coming Soon</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We're building a powerful tool to help you estimate mobile home values based on location, condition, and
                market trends.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
