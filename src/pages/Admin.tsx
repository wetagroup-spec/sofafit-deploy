import { useRef, useState } from "react";
import { Link } from "react-router";
import { Plus, Pen, Trash2, UploadCloud, ExternalLink, Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/providers/trpc";
import { uploadExamplePhotos, examplePhotoUrl } from "@/lib/upload";

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  awaiting_feedback: "Awaiting feedback",
  in_revision: "Revision requested",
  completed: "Completed",
};

function OrdersTab() {
  const ordersQuery = trpc.orders.list.useQuery(undefined, { refetchInterval: 15000 });
  const setStatus = trpc.orders.setStatus.useMutation({
    onSuccess: () => ordersQuery.refetch(),
  });
  const orders = ordersQuery.data ?? [];

  return (
    <div className="space-y-3">
      {orders.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No orders yet. New orders will appear here and in MAX notifications.
        </p>
      )}
      {orders.map((o) => (
        <Card key={o.id}>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Order #{o.id} — {o.customerName}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {new Date(o.createdAt).toLocaleString()} · {o.files.length} file(s) ·{" "}
                {o.messages.length} message(s)
                {o.comment ? ` · ${o.comment}` : ""}
              </p>
            </div>
            <Select
              value={o.status}
              onValueChange={(v) =>
                setStatus.mutate({ id: o.id, status: v as typeof o.status })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/orders/${o.code}?as=studio`}>
                Open chat <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExamplesTab() {
  const examplesQuery = trpc.examples.list.useQuery();
  const createExample = trpc.examples.create.useMutation({
    onSuccess: () => examplesQuery.refetch(),
  });
  const updateExample = trpc.examples.update.useMutation({
    onSuccess: () => examplesQuery.refetch(),
  });
  const removeExample = trpc.examples.remove.useMutation({
    onSuccess: () => examplesQuery.refetch(),
  });
  const setPhotoCaption = trpc.examples.setPhotoCaption.useMutation({
    onSuccess: () => examplesQuery.refetch(),
  });
  const removePhoto = trpc.examples.removePhoto.useMutation({
    onSuccess: () => examplesQuery.refetch(),
  });

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [captionEdit, setCaptionEdit] = useState<{ id: number; value: string } | null>(null);
  const [busyUpload, setBusyUpload] = useState<number | null>(null);
  const uploadInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const examples = examplesQuery.data ?? [];

  async function handleUpload(exampleId: number, list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusyUpload(exampleId);
    try {
      await uploadExamplePhotos(exampleId, Array.from(list));
      await examplesQuery.refetch();
    } finally {
      setBusyUpload(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-medium">Add example</p>
          <div className="flex flex-wrap gap-2">
            <Input
              className="w-64"
              placeholder='Title, e.g. "Olive corner sofa, 710 cm room"'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              className="w-64"
              placeholder="Subtitle (optional)"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
            <Button
              onClick={() => {
                if (!title.trim()) return;
                createExample.mutate({ title: title.trim(), subtitle: subtitle.trim() || undefined });
                setTitle("");
                setSubtitle("");
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {examples.map((ex) => (
        <Card key={ex.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{ex.title}</p>
                {ex.subtitle && <p className="text-sm text-muted-foreground">{ex.subtitle}</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const t = prompt("Example title", ex.title);
                    if (t) updateExample.mutate({ id: ex.id, title: t, subtitle: ex.subtitle ?? undefined });
                  }}
                >
                  <Pen className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete this example with all photos?")) removeExample.mutate({ id: ex.id });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ex.photos.map((p) => (
                <figure key={p.id} className="overflow-hidden rounded-xl border">
                  <div className="relative">
                    <img
                      src={examplePhotoUrl(p.id)}
                      alt={p.caption ?? ""}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Edit caption"
                        onClick={() => setCaptionEdit({ id: p.id, value: p.caption ?? "" })}
                      >
                        <Pen className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Delete photo"
                        onClick={() => removePhoto.mutate({ id: p.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <figcaption className="min-h-8 px-3 py-2 text-sm text-muted-foreground">
                    {p.caption || <span className="italic">No caption</span>}
                  </figcaption>
                </figure>
              ))}

              <button
                className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                onClick={() => uploadInputs.current[ex.id]?.click()}
              >
                {busyUpload === ex.id ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <UploadCloud className="h-8 w-8" />
                )}
                <span className="mt-1 text-sm">Upload photos</span>
                <input
                  ref={(el) => {
                    uploadInputs.current[ex.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    handleUpload(ex.id, e.target.files);
                    e.target.value = "";
                  }}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={captionEdit !== null} onOpenChange={(o) => !o && setCaptionEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Photo caption</DialogTitle>
          </DialogHeader>
          <Textarea
            value={captionEdit?.value ?? ""}
            onChange={(e) =>
              setCaptionEdit((c) => (c ? { ...c, value: e.target.value } : c))
            }
            placeholder="e.g. Room photo. Width 710 cm."
            rows={2}
            autoFocus
          />
          <DialogFooter>
            <Button
              onClick={() => {
                if (captionEdit) {
                  setPhotoCaption.mutate({ id: captionEdit.id, caption: captionEdit.value });
                  setCaptionEdit(null);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Admin() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Studio admin</h1>
            <p className="text-sm text-muted-foreground">
              Orders, fitting chats and portfolio examples
            </p>
          </div>
          <Badge variant="outline">Manager area</Badge>
        </div>
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-4">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="examples" className="mt-4">
            <ExamplesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
