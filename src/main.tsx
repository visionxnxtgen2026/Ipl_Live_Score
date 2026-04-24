import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

// If you have router
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

// If no router, comment above 2 lines and use App instead

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
