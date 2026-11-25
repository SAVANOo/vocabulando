import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import { App } from "./App.tsx";
import { SafeErrorBoundary } from "./components/SafeErrorBoundary.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SafeErrorBoundary>
      <App />
    </SafeErrorBoundary>
  </StrictMode>,
);
