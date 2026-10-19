import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import dotenv from "dotenv";
import react from "@vitejs/plugin-react";
export default defineConfig(() => {
  // Read the server port without loading backend environment settings into Vite.
  const envFile = fileURLToPath(new URL("../.env", import.meta.url));
  const env = existsSync(envFile) ? dotenv.parse(readFileSync(envFile)) : {};
  const target = `http://127.0.0.1:${process.env.PORT || env.PORT || 5000}`;
  return {
    plugins: [react()],
    server: { port: 5173, proxy: { "/api": target, "/uploads": target } },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            mui: [
              "@mui/material",
              "@mui/icons-material",
              "@emotion/react",
              "@emotion/styled",
            ],
            react: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
  };
});
