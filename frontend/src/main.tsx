import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "@/components/ui/sonner";
import { AppQueryProvider } from "@/lib/query/provider";
import { registerServiceWorker } from "@/pwa";
import { router } from "@/router";

import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element; check index.html.");
}

createRoot(rootElement).render(
  <StrictMode>
    {/* next-themes drives the `.dark` class that index.css keys off, and the
        sonner Toaster reads the resolved theme through useTheme(). */}
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppQueryProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </AppQueryProvider>
    </ThemeProvider>
  </StrictMode>,
);

// After render, not before: registration is not on the path to first paint, and
// its only UI is a toast that needs the toaster mounted to appear in.
registerServiceWorker();
