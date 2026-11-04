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

export const leadSchema = z.object({
  business: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  category: z.string().max(100).optional(),
  plan: z.enum(["free", "founding"]).default("free"),
  kind: z.enum(["business", "claim", "contact"]).default("business"),
  providerId: z.string().max(64).optional(),
  message: z.string().max(2000).optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type SlotsInput = z.infer<typeof slotsSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
