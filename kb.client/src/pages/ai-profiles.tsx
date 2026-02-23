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
import { Plus } from "lucide-react";

const mockProfiles = [
  {
    id: "1",
    name: "Lena Default",
    isActive: true,
    model: "gpt-4o",
    knowledgeBase: "Swedish Legal Knowledge",
    topK: 10,
    minRelevanceThreshold: 0.7,
  },
  {
    id: "2",
    name: "Lena Strict",
    isActive: false,
    model: "gpt-4o",
    knowledgeBase: "Swedish Legal Knowledge",
    topK: 5,
    minRelevanceThreshold: 0.85,
  },
  {
    id: "3",
    name: "Lena Test",
    isActive: false,
    model: "gpt-4o-mini",
    knowledgeBase: "Test Knowledge Base",
    topK: 10,
    minRelevanceThreshold: 0.6,
  },
];

export function AiProfilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Profiles</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Profile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All AI Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Knowledge Base</TableHead>
                <TableHead>Top K</TableHead>
                <TableHead>Min Relevance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell className="font-mono text-sm">{profile.model}</TableCell>
                  <TableCell>{profile.knowledgeBase}</TableCell>
                  <TableCell>{profile.topK}</TableCell>
                  <TableCell>{profile.minRelevanceThreshold}</TableCell>
                  <TableCell>
                    <Badge variant={profile.isActive ? "default" : "secondary"}>
                      {profile.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {!profile.isActive && (
                      <Button variant="outline" size="sm">
                        Activate
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      Edit
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
