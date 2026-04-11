import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThirdwebProvider } from "thirdweb/react";
import App from "./App";
import "./index.css";
import { injectBrandCSS } from "./config/brand";

injectBrandCSS();

// Agentation — visual feedback tool for AI coding agents (dev only)
const Agentation = import.meta.env.DEV
  ? (await import("agentation")).Agentation
  : null;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThirdwebProvider>
        <App />
      </ThirdwebProvider>
      {Agentation ? <Agentation /> : null}
    </BrowserRouter>
  </React.StrictMode>
);
