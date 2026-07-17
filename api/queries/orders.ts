import { desc, eq, asc } from "drizzle-orm";
import { getDb } from "./connection";
import { orders, messages, files } from "@db/schema";

export async function createOrder(input: {
  code: string;
  customerName: string;
  contact?: string;
  comment?: string;
}) {
  const db = getDb();
  await db.insert(orders).values({
    code: input.code,
    customerName: input.customerName,
    contact: input.contact || null,
    comment: input.comment || null,
  });
  const [row] = await db.select().from(orders).where(eq(orders.code, input.code));
  return row;
}

export async function listOrders() {
  const db = getDb();
  return db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: { files: true, messages: true },
  });
}

export async function getOrderByCode(code: string) {
  const db = getDb();
  return db.query.orders.findFirst({
    where: eq(orders.code, code),
    with: {
      files: true,
      messages: {
        orderBy: [asc(messages.createdAt)],
        with: { files: true },
      },
    },
  });
}

export async function getOrderById(id: number) {
  const db = getDb();
  return db.query.orders.findFirst({ where: eq(orders.id, id) });
}

export async function updateOrderStatus(
  id: number,
  status: "new" | "in_progress" | "awaiting_feedback" | "in_revision" | "completed",
) {
  const db = getDb();
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  return db.query.orders.findFirst({ where: eq(orders.id, id) });
}

export async function updateFileCaption(id: number, caption: string) {
  const db = getDb();
  await db.update(files).set({ caption }).where(eq(files.id, id));
}

export async function createMessage(input: {
  orderId: number;
  sender: "customer" | "studio";
  text?: string;
}) {
  const db = getDb();
  const result = await db.insert(messages).values({
    orderId: input.orderId,
    sender: input.sender,
    text: input.text || null,
  });
  const id = Number(result[0].insertId);
  const [row] = await db.select().from(messages).where(eq(messages.id, id));
  return row;
}

export async function deleteFileRecord(id: number) {
  const db = getDb();
  const [row] = await db.select().from(files).where(eq(files.id, id));
  await db.delete(files).where(eq(files.id, id));
  return row;
}

export async function getFileById(id: number) {
  const db = getDb();
  const [row] = await db.select().from(files).where(eq(files.id, id));
  return row;
}
