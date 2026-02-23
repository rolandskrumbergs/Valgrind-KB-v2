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
import { Plus, Upload } from "lucide-react";

const mockKBs = [
  {
    id: "1",
    name: "Swedish Legal Knowledge",
    slug: "swedish-legal",
    isActive: true,
    documentsCount: 142,
    totalChunks: 8540,
  },
  {
    id: "2",
    name: "Guardianship Handbook",
    slug: "guardianship",
    isActive: true,
    documentsCount: 38,
    totalChunks: 2150,
  },
  {
    id: "3",
    name: "Test Knowledge Base",
    slug: "test-kb",
    isActive: false,
    documentsCount: 5,
    totalChunks: 120,
  },
];

const mockDocuments = [
  { id: "1", fileName: "Föräldrabalken.pdf", category: "Laws", status: "Completed", chunks: 245, size: "2.4 MB" },
  { id: "2", fileName: "Ärvdabalken.pdf", category: "Laws", status: "Completed", chunks: 189, size: "1.8 MB" },
  { id: "3", fileName: "Godmanskap_handbok.pdf", category: "Books", status: "Processing", chunks: 0, size: "5.1 MB" },
  { id: "4", fileName: "NJA_2024_412.pdf", category: "LegalCases", status: "Completed", chunks: 34, size: "0.4 MB" },
  { id: "5", fileName: "Överförmyndare_guide.pdf", category: "Other", status: "Failed", chunks: 0, size: "3.2 MB" },
];

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Processing: "secondary",
  Failed: "destructive",
  Uploaded: "secondary",
};

export function KnowledgeBasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Bases</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Knowledge Base
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {mockKBs.map((kb) => (
          <Card key={kb.id} className="cursor-pointer hover:border-accent transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{kb.name}</CardTitle>
              <Badge variant={kb.isActive ? "default" : "secondary"}>
                {kb.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">Slug: {kb.slug}</p>
              <p className="text-sm text-muted-foreground">
                {kb.documentsCount} documents · {kb.totalChunks.toLocaleString()} chunks
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents — Swedish Legal Knowledge</CardTitle>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.fileName}</TableCell>
                  <TableCell>{doc.category}</TableCell>
                  <TableCell>{doc.size}</TableCell>
                  <TableCell>{doc.chunks}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[doc.status] ?? "secondary"}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Delete
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
