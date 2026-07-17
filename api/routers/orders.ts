import { z } from "zod";
import { randomBytes } from "node:crypto";
import { createRouter, publicQuery } from "../middleware";
import { notifyMax } from "../notify/max";
import {
  createOrder,
  listOrders,
  getOrderByCode,
  getOrderById,
  updateOrderStatus,
  updateFileCaption,
  createMessage,
} from "../queries/orders";

const statusEnum = z.enum([
  "new",
  "in_progress",
  "awaiting_feedback",
  "in_revision",
  "completed",
]);

const STATUS_LABEL: Record<z.infer<typeof statusEnum>, string> = {
  new: "New",
  in_progress: "In progress",
  awaiting_feedback: "Preview sent — awaiting feedback",
  in_revision: "Revision requested",
  completed: "Completed",
};

export const ordersRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        customerName: z.string().min(1).max(255),
        contact: z.string().max(255).optional(),
        comment: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const code = randomBytes(6).toString("hex");
      const order = await createOrder({ code, ...input });
      void notifyMax(
        `🛋 New SofaFit order #${order.id}\nCustomer: ${order.customerName}` +
          (order.contact ? `\nContact: ${order.contact}` : "") +
          (order.comment ? `\nComment: ${order.comment}` : "") +
          `\nLink: /orders/${order.code}`,
      );
      return order;
    }),

  list: publicQuery.query(() => listOrders()),

  byCode: publicQuery
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const order = await getOrderByCode(input.code);
      if (!order) throw new Error("Order not found");
      return order;
    }),

  setStatus: publicQuery
    .input(z.object({ id: z.number(), status: statusEnum, note: z.string().optional() }))
    .mutation(async ({ input }) => {
      const order = await updateOrderStatus(input.id, input.status);
      if (!order) throw new Error("Order not found");
      void notifyMax(
        `📦 Order #${order.id} status → ${STATUS_LABEL[input.status]}` +
          (input.note ? `\n${input.note}` : ""),
      );
      return order;
    }),

  setFileCaption: publicQuery
    .input(z.object({ id: z.number(), caption: z.string().max(2000) }))
    .mutation(({ input }) => updateFileCaption(input.id, input.caption)),

  sendMessage: publicQuery
    .input(
      z.object({
        orderId: z.number(),
        sender: z.enum(["customer", "studio"]),
        text: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const order = await getOrderById(input.orderId);
      if (!order) throw new Error("Order not found");
      const message = await createMessage(input);
      void notifyMax(
        `💬 Order #${order.id} — new message from ${input.sender === "studio" ? "Studio" : order.customerName}:\n${input.text ?? "(file)"}`,
      );
      return message;
    }),
});
