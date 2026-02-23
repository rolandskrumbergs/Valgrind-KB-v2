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

const mockArticles = [
  { id: "1", title: "Nya regler för godmanskap 2026", status: "Published", author: "Admin User", publishedAt: "2026-02-20" },
  { id: "2", title: "Förändringar i förvaltarskapslagen", status: "Draft", author: "Admin User", publishedAt: null },
  { id: "3", title: "Guide: Ansökan om god man", status: "Published", author: "Admin User", publishedAt: "2026-02-15" },
  { id: "4", title: "Ekonomisk redovisning för ställföreträdare", status: "Published", author: "Admin User", publishedAt: "2026-02-10" },
  { id: "5", title: "Kommande utbildningar våren 2026", status: "Draft", author: "Admin User", publishedAt: null },
];

export function ArticlesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Article
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.author}</TableCell>
                  <TableCell>
                    <Badge variant={article.status === "Published" ? "default" : "secondary"}>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{article.publishedAt ?? "—"}</TableCell>
                  <TableCell className="text-right">
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
