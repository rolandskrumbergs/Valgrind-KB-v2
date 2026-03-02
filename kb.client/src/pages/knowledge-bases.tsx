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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  knowledgeBaseApi,
  documentApi,
  type KnowledgeBase,
  type Document,
} from "@/lib/api";

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Processing: "secondary",
  Failed: "destructive",
  Uploaded: "secondary",
  Pending: "secondary",
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function KnowledgeBasesPage() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // KB dialog
  const [kbDialogOpen, setKbDialogOpen] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);
  const [kbForm, setKbForm] = useState({ name: "", slug: "", description: "", isActive: true });
  const [isSavingKb, setIsSavingKb] = useState(false);

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Laws");
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadKbs() {
    const { data, error } = await knowledgeBaseApi.getAll();
    if (error) toast.error(error);
    if (data) setKbs(data);
    setIsLoading(false);
  }

  async function loadDocuments(kbId: string) {
    setIsLoadingDocs(true);
    const { data, error } = await documentApi.getAll(kbId);
    if (error) toast.error(error);
    if (data) setDocuments(data);
    setIsLoadingDocs(false);
  }

  useEffect(() => {
    loadKbs();
  }, []);

  function selectKb(kb: KnowledgeBase) {
    setSelectedKb(kb);
    loadDocuments(kb.id);
  }

  function openCreateKb() {
    setEditingKb(null);
    setKbForm({ name: "", slug: "", description: "", isActive: true });
    setKbDialogOpen(true);
  }

  function openEditKb(kb: KnowledgeBase) {
    setEditingKb(kb);
    setKbForm({
      name: kb.name,
      slug: kb.slug,
      description: kb.description ?? "",
      isActive: kb.isActive,
    });
    setKbDialogOpen(true);
  }

  async function handleSaveKb() {
    if (!kbForm.name) {
      toast.error("Name is required");
      return;
    }
    setIsSavingKb(true);

    const result = editingKb
      ? await knowledgeBaseApi.update(editingKb.id, {
          name: kbForm.name,
          description: kbForm.description || undefined,
          isActive: kbForm.isActive,
        })
      : await knowledgeBaseApi.create({
          name: kbForm.name,
          slug: kbForm.slug,
          description: kbForm.description || undefined,
        });

    setIsSavingKb(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editingKb ? "Knowledge base updated" : "Knowledge base created");
    setKbDialogOpen(false);
    loadKbs();
  }

  async function handleDeleteKb(id: string) {
    if (!confirm("Delete this knowledge base and all its documents?")) return;
    const { error } = await knowledgeBaseApi.delete(id);
    if (error) toast.error(error);
    else {
      toast.success("Knowledge base deleted");
      if (selectedKb?.id === id) {
        setSelectedKb(null);
        setDocuments([]);
      }
      loadKbs();
    }
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !selectedKb) return;

    setIsUploading(true);
    const { error } = await documentApi.upload(
      selectedKb.id,
      file,
      uploadCategory
    );
    setIsUploading(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Document uploaded");
    setUploadDialogOpen(false);
    if (fileRef.current) fileRef.current.value = "";
    loadDocuments(selectedKb.id);
  }

  async function handleReprocess(docId: string) {
    if (!selectedKb) return;
    const { error } = await documentApi.reprocess(selectedKb.id, docId);
    if (error) toast.error(error);
    else {
      toast.success("Reprocessing started");
      loadDocuments(selectedKb.id);
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!selectedKb || !confirm("Delete this document?")) return;
    const { error } = await documentApi.delete(selectedKb.id, docId);
    if (error) toast.error(error);
    else {
      toast.success("Document deleted");
      loadDocuments(selectedKb.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Bases</h1>
        <Button onClick={openCreateKb}>
          <Plus className="mr-2 h-4 w-4" />
          New Knowledge Base
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : kbs.length === 0 ? (
        <p className="text-muted-foreground">No knowledge bases yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {kbs.map((kb) => (
            <Card
              key={kb.id}
              className={`cursor-pointer transition-colors ${
                selectedKb?.id === kb.id
                  ? "border-primary"
                  : "hover:border-accent"
              }`}
              onClick={() => selectKb(kb)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{kb.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={kb.isActive ? "default" : "secondary"}>
                    {kb.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-1">
                  Slug: {kb.slug}
                </p>
                {kb.description && (
                  <p className="text-sm text-muted-foreground">{kb.description}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditKb(kb);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteKb(kb.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedKb && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documents — {selectedKb.name}</CardTitle>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingDocs ? (
              <p className="text-muted-foreground">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-muted-foreground">
                No documents yet. Upload a document to get started.
              </p>
            ) : (
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
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.fileName}
                      </TableCell>
                      <TableCell>{doc.category}</TableCell>
                      <TableCell>{formatBytes(doc.fileSize)}</TableCell>
                      <TableCell>
                        {doc.indexedChunks}/{doc.totalChunks}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusColors[doc.processingStatus] ?? "secondary"
                          }
                        >
                          {doc.processingStatus}
                        </Badge>
                        {doc.errorMessage && (
                          <span
                            className="ml-2 text-xs text-destructive"
                            title={doc.errorMessage}
                          >
                            (error)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {doc.processingStatus === "Failed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleReprocess(doc.id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteDoc(doc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* KB Create/Edit Dialog */}
      <Dialog open={kbDialogOpen} onOpenChange={setKbDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKb ? "Edit Knowledge Base" : "Create Knowledge Base"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="kb-name">Name</Label>
              <Input
                id="kb-name"
                value={kbForm.name}
                onChange={(e) =>
                  setKbForm({ ...kbForm, name: e.target.value })
                }
              />
            </div>
            {!editingKb && (
              <div className="grid gap-2">
                <Label htmlFor="kb-slug">Slug</Label>
                <Input
                  id="kb-slug"
                  value={kbForm.slug}
                  onChange={(e) =>
                    setKbForm({ ...kbForm, slug: e.target.value })
                  }
                  placeholder="e.g. swedish-legal"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="kb-desc">Description</Label>
              <Input
                id="kb-desc"
                value={kbForm.description}
                onChange={(e) =>
                  setKbForm({ ...kbForm, description: e.target.value })
                }
              />
            </div>
            {editingKb && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="kb-active"
                  checked={kbForm.isActive}
                  onChange={(e) =>
                    setKbForm({ ...kbForm, isActive: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="kb-active">Active</Label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setKbDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveKb} disabled={isSavingKb}>
              {isSavingKb && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingKb ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="doc-file">File</Label>
              <Input id="doc-file" type="file" ref={fileRef} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={uploadCategory}
                onValueChange={setUploadCategory}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laws">Laws</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="LegalCases">Legal Cases</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
