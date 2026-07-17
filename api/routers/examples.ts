import { z } from "zod";
import { eq, asc, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { examples, examplePhotos } from "@db/schema";

export const examplesRouter = createRouter({
  list: publicQuery.query(() =>
    getDb().query.examples.findMany({
      orderBy: [desc(examples.createdAt)],
      with: { photos: { orderBy: [asc(examplePhotos.sortOrder), asc(examplePhotos.id)] } },
    }),
  ),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        subtitle: z.string().max(512).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(examples).values({
        title: input.title,
        subtitle: input.subtitle || null,
      });
      const id = Number(result[0].insertId);
      const [row] = await db.select().from(examples).where(eq(examples.id, id));
      return row;
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255),
        subtitle: z.string().max(512).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(examples)
        .set({ title: input.title, subtitle: input.subtitle || null })
        .where(eq(examples.id, input.id));
    }),

  remove: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(examples).where(eq(examples.id, input.id));
    }),

  setPhotoCaption: publicQuery
    .input(z.object({ id: z.number(), caption: z.string().max(2000) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(examplePhotos)
        .set({ caption: input.caption })
        .where(eq(examplePhotos.id, input.id));
    }),

  removePhoto: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(examplePhotos).where(eq(examplePhotos.id, input.id));
    }),
});
