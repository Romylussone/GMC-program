import { z } from "zod";
const short = z.string().trim().min(1).max(150);
const https = z
  .url()
  .refine((value) => /^https:\/\//i.test(value), "Une URL HTTPS est requise.");
export const preferencesInput = z
  .object({
    city: short,
    district: z.string().trim().max(100),
    transaction: z.enum(["rent", "sale"]),
    type: z.enum(["", "apartment", "villa", "house", "land", "office"]),
    budget: z.number().positive().max(1e12),
    bedrooms: z.number().int().min(0).max(30),
  })
  .strict();
export const propertyInput = z
  .object({
    title: short.min(5),
    description: z.string().trim().min(30).max(6000),
    transaction: z.enum(["rent", "sale"]),
    type: z.enum(["apartment", "villa", "house", "land", "office"]),
    price: z.number().positive().max(1e12),
    area: z.number().positive().max(1e7),
    bedrooms: z.number().int().min(0).max(100),
    bathrooms: z.number().int().min(0).max(100),
    city: short,
    district: short,
    address: short,
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    images: z.array(https).min(1).max(12),
    panorama: z.union([https, z.literal("")]).default(""),
    amenities: z.array(short).max(20),
    status: z.enum(["published", "draft", "archived"]),
  })
  .strict();
export const registerInput = z
  .object({
    name: short.min(2),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(10).max(128),
    phone: z.string().trim().max(30).default(""),
    role: z.enum(["seeker", "owner", "agency"]),
  })
  .strict();
export const loginInput = registerInput.pick({ email: true, password: true });
export const messageInput = z
  .object({ message: z.string().trim().min(3).max(2000) })
  .strict();
export const appointmentInput = z
  .object({
    propertyId: z.string().regex(/^[a-f\d]{24}$/i),
    startsAt: z.iso.datetime(),
    message: z.string().trim().max(2000).default(""),
  })
  .strict();
export const filtersInput = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  transaction: z.enum(["rent", "sale"]).optional(),
  type: propertyInput.shape.type.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(0).max(100).optional(),
  tour: z.enum(["true"]).optional(),
  sort: z.enum(["recent", "price-asc", "price-desc"]).default("recent"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});
