import { relations } from "drizzle-orm";
import { orders, messages, files, examples, examplePhotos } from "./schema";

export const ordersRelations = relations(orders, ({ many }) => ({
  messages: many(messages),
  files: many(files),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  order: one(orders, { fields: [messages.orderId], references: [orders.id] }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  order: one(orders, { fields: [files.orderId], references: [orders.id] }),
  message: one(messages, {
    fields: [files.messageId],
    references: [messages.id],
  }),
}));

export const examplesRelations = relations(examples, ({ many }) => ({
  photos: many(examplePhotos),
}));

export const examplePhotosRelations = relations(examplePhotos, ({ one }) => ({
  example: one(examples, {
    fields: [examplePhotos.exampleId],
    references: [examples.id],
  }),
}));
