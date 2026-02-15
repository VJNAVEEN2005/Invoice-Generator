import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InvoiceProvider } from "./context/InvoiceContext";
import { ToastProvider } from "./context/ToastContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <InvoiceProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </InvoiceProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
