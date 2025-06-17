/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },
  
  runtimeEnv: {
    DATABASE_URL: typeof process.env.DATABASE_URL === "string" ? process.env.DATABASE_URL : "",
    NODE_ENV: typeof process.env.NODE_ENV === "string" ? process.env.NODE_ENV : "development",
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
