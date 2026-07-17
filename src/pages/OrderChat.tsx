import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Loader2,
  Download,
  FileIcon,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/providers/trpc";
import { uploadOrderFiles, fileUrl, fileDownloadUrl, filesZipUrl, formatSize } from "@/lib/upload";

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "New", variant: "secondary" },
  in_progress: { label: "In progress", variant: "default" },
  awaiting_feedback: { label: "Preview sent — awaiting feedback", variant: "outline" },
  in_revision: { label: "Revision requested", variant: "destructive" },
  completed: { label: "Completed ✓", variant: "secondary" },
};

type AttachedFile = {
  id: number;
  fileName: string;
  mimeType: string;
  size: number;
  kind: string;
  caption: string | null;
};

function FileChip({ f }: { f: AttachedFile }) {
  const isImage = f.mimeType.startsWith("image/");
  return (
    <div className="mt-2 overflow-hidden rounded-lg border bg-background">
      {isImage && (
        <a href={fileUrl(f.id)} target="_blank" rel="noreferrer">
          <img src={fileUrl(f.id)} alt={f.fileName} className="max-h-64 w-full object-cover" />
        </a>
      )}
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
        <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
        <a href={fileDownloadUrl(f.id)} title="Download">
          <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </a>
      </div>
      {f.caption && (
        <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">{f.caption}</p>
      )}
    </div>
  );
}

export default function OrderChat() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const asStudio = searchParams.get("as") === "studio";
  const sender = asStudio ? "studio" : "customer";

  const orderQuery = trpc.orders.byCode.useQuery(
    { code: code ?? "" },
    { enabled: !!code, refetchInterval: 8000 },
  );
  const sendMessage = trpc.orders.sendMessage.useMutation();
  const setStatus = trpc.orders.setStatus.useMutation();

  const [text, setText] = useState("");
  const [pending, setPending] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attachInput = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const order = orderQuery.data;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [order?.messages.length]);

  async function handleSend(kind: "attachment" | "result" = "attachment") {
    if (!order) return;
    if (!text.trim() && pending.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const msg = await sendMessage.mutateAsync({
        orderId: order.id,
        sender,
        text: text.trim() || undefined,
      });
      if (pending.length > 0) {
        await uploadOrderFiles(order.id, pending, { kind, messageId: msg.id });
      }
      setText("");
      setPending([]);
      await orderQuery.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: "in_progress" | "awaiting_feedback" | "in_revision" | "completed") {
    if (!order) return;
    await setStatus.mutateAsync({ id: order.id, status });
    await orderQuery.refetch();
  }

  if (orderQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="p-10 text-center text-muted-foreground">Loading order…</p>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="p-10 text-center text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const meta = STATUS_META[order.status] ?? STATUS_META.new;
  const inputFiles = order.files.filter((f) => f.kind === "input");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link to={asStudio ? "/admin" : "/"}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order #{order.id}</h1>
            <p className="text-sm text-muted-foreground">
              {order.customerName}
              {order.contact ? ` · ${order.contact}` : ""} ·{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        {order.comment && (
          <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">{order.comment}</p>
        )}

        {inputFiles.length > 0 && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Task photos</p>
                {inputFiles.length > 1 && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={filesZipUrl(inputFiles.map((f) => f.id))}>
                      <Download className="mr-1 h-4 w-4" /> Download all ({inputFiles.length})
                    </a>
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {inputFiles.map((f) => (
                  <FileChip key={f.id} f={f} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat */}
        <div className="mt-6 space-y-3">
          {order.messages.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No messages yet. Write here — our manager replies in this thread.
            </p>
          )}
          {order.messages.map((m) => {
            const mine =
              (sender === "studio" && m.sender === "studio") ||
              (sender === "customer" && m.sender === "customer");
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.sender === "studio"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  }`}
                >
                  <p className={`text-xs ${m.sender === "studio" ? "opacity-80" : "text-muted-foreground"}`}>
                    {m.sender === "studio" ? "SofaFit Studio" : order.customerName} ·{" "}
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                  {m.text && <p className="mt-1 whitespace-pre-wrap text-sm">{m.text}</p>}
                  {m.files.map((f) => (
                    <FileChip key={f.id} f={f} />
                  ))}
                  {m.files.length > 1 && (
                    <Button
                      size="sm"
                      variant={m.sender === "studio" ? "secondary" : "outline"}
                      className="mt-2"
                      asChild
                    >
                      <a href={filesZipUrl(m.files.map((f) => f.id))}>
                        <Download className="mr-1 h-4 w-4" /> Download all {m.files.length} photos (ZIP)
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        {order.status !== "completed" && (
          <Card className="mt-6">
            <CardContent className="p-4">
              {pending.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pending.map((f, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                    >
                      {f.name}
                      <button onClick={() => setPending((p) => p.filter((_, j) => j !== i))}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Attach files"
                  onClick={() => attachInput.current?.click()}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <input
                  ref={attachInput}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    setPending((p) => [...p, ...Array.from(e.target.files ?? [])]);
                    e.target.value = "";
                  }}
                />
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    asStudio
                      ? "Message to the customer…"
                      : "Message to the studio (what to fix, comments)…"
                  }
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={() => handleSend(asStudio ? "result" : "attachment")} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

              {/* Workflow actions */}
              <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                {asStudio ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => changeStatus("in_progress")}>
                      Start work
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changeStatus("awaiting_feedback")}
                    >
                      Preview sent
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => changeStatus("completed")}>
                      Mark completed
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => changeStatus("in_revision")}>
                      <RotateCcw className="mr-1 h-4 w-4" /> Request revision
                    </Button>
                    <Button size="sm" onClick={() => changeStatus("completed")}>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> All good — approve
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {order.status === "completed" && (
          <p className="mt-6 rounded-lg bg-muted px-4 py-3 text-center text-sm">
            This order is completed. Thank you! 🛋
          </p>
        )}
      </main>
    </div>
  );
}
