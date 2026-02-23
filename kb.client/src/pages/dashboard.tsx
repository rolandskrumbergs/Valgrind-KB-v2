import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Building2, Brain } from "lucide-react";

const stats = [
  { title: "Total Conversations", value: "1,234", icon: MessageSquare },
  { title: "Active Members", value: "56", icon: Users },
  { title: "Organizations", value: "12", icon: Building2 },
  { title: "Knowledge Bases", value: "3", icon: Brain },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to IBBEN Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage your organizations, knowledge bases, AI profiles, and content from here.
            Use the sidebar to navigate between sections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
