// library-ui fonts.css lacks the 600 that font-semibold renders at.
import "@fontsource/inter/600.css";
import "./app/globals.css";

import { RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";

import { del } from "@/lib/indexdb";
import { router } from "./router";

const rootElement = document.getElementById("root")!;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// Browsers that used the demo still hold its signing key and session token.
Promise.allSettled([del("keys"), del("currentKey"), del("token")]);
