import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export default function MessengerInbox() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messenger</h1>
            <p className="text-muted-foreground">Communicate with leads and team members</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>Your messages and conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] flex flex-col items-center justify-center">
              <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Messenger Coming Soon</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We're building an integrated messaging system for communicating with leads, buyers, and team members.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
