import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
} from "drizzle-orm/mysql-core";

export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 255 }),
  comment: text("comment"),
  status: mysqlEnum("status", [
    "new",
    "in_progress",
    "awaiting_feedback",
    "in_revision",
    "completed",
  ])
    .notNull()
    .default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  sender: mysqlEnum("sender", ["customer", "studio"]).notNull(),
  text: text("text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const files = mysqlTable("files", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  messageId: bigint("message_id", { mode: "number", unsigned: true }).references(
    () => messages.id,
    { onDelete: "set null" },
  ),
  kind: mysqlEnum("kind", ["input", "result", "attachment"])
    .notNull()
    .default("input"),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  size: int("size").notNull(),
  storagePath: varchar("storage_path", { length: 1024 }).notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const examples = mysqlTable("examples", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 512 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const examplePhotos = mysqlTable("example_photos", {
  id: serial("id").primaryKey(),
  exampleId: bigint("example_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => examples.id, { onDelete: "cascade" }),
  storagePath: varchar("storage_path", { length: 1024 }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull().default("image/jpeg"),
  caption: text("caption"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
