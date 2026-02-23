import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const mockMembers = [
  { id: "1", name: "Anna Svensson", email: "anna@stockholm.se", org: "Stockholms Kommun", role: "User", isBanned: false },
  { id: "2", name: "Erik Johansson", email: "erik@goteborg.se", org: "Göteborgs Kommun", role: "User", isBanned: false },
  { id: "3", name: "Maria Lindberg", email: "maria@malmo.se", org: "Malmö Kommun", role: "User", isBanned: true },
  { id: "4", name: "Johan Andersson", email: "johan@uppsala.se", org: "Uppsala Kommun", role: "User", isBanned: false },
  { id: "5", name: "Lisa Eriksson", email: "lisa@stockholm.se", org: "Stockholms Kommun", role: "User", isBanned: false },
];

export function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Members</h1>
        <Button>Invite Member</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-8" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.org}</TableCell>
                  <TableCell>
                    <Badge variant={member.isBanned ? "destructive" : "default"}>
                      {member.isBanned ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      {member.isBanned ? "Unban" : "Ban"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
