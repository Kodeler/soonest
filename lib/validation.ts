import { z } from "zod/v4";

export const searchSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(100).default(25),
  categorySlug: z.string().optional(),
  keyword: z.string().optional(),
  asap: z.boolean().default(false),
});

export const bookSchema = z.object({
  slotId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
});

export const slotsSchema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
});

export type SearchInput = z.infer<typeof searchSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type SlotsInput = z.infer<typeof slotsSchema>;
