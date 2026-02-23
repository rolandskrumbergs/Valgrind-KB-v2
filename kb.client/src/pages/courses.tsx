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

const mockCourses = [
  { id: "1", title: "Grundkurs i godmanskap", status: "Published", chapters: 8, price: "299 SEK", enrollments: 45 },
  { id: "2", title: "Ekonomisk förvaltning", status: "Published", chapters: 6, price: "399 SEK", enrollments: 32 },
  { id: "3", title: "Juridisk introduktion", status: "Draft", chapters: 4, price: "0 SEK", enrollments: 0 },
  { id: "4", title: "Avancerad ställföreträdarskap", status: "Draft", chapters: 10, price: "499 SEK", enrollments: 0 },
];

export function CoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Chapters</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.chapters}</TableCell>
                  <TableCell>{course.price}</TableCell>
                  <TableCell>{course.enrollments}</TableCell>
                  <TableCell>
                    <Badge variant={course.status === "Published" ? "default" : "secondary"}>
                      {course.status}
                    </Badge>
                  </TableCell>
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
