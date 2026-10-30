import "dotenv/config";
import { z } from "zod";

export const config = z
  .object({
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/artparts"),
    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET doit contenir au moins 32 caractères."),
    WEB_ORIGIN: z.url().default("http://localhost:3100"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .parse(process.env);
