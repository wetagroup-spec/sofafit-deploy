export type UploadedFile = {
  id: number;
  orderId: number;
  messageId: number | null;
  kind: "input" | "result" | "attachment";
  fileName: string;
  mimeType: string;
  size: number;
  caption: string | null;
  createdAt: string;
};

export async function uploadOrderFiles(
  orderId: number,
  files: File[],
  opts: { kind?: string; messageId?: number } = {},
): Promise<UploadedFile[]> {
  const params = new URLSearchParams();
  if (opts.kind) params.set("kind", opts.kind);
  if (opts.messageId) params.set("messageId", String(opts.messageId));
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  const res = await fetch(`/api/orders/${orderId}/files?${params}`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { files: UploadedFile[] };
  return data.files;
}

export async function uploadExamplePhotos(
  exampleId: number,
  files: File[],
): Promise<void> {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  const res = await fetch(`/api/examples/${exampleId}/photos`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
}

export function fileUrl(id: number) {
  return `/api/files/${id}`;
}

export function fileDownloadUrl(id: number) {
  return `/api/files/${id}/download`;
}

export function filesZipUrl(ids: number[]) {
  return `/api/files-zip?ids=${ids.join(",")}`;
}

export function examplePhotoUrl(id: number) {
  return `/api/example-photos/${id}`;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
