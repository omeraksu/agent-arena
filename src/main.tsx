import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThirdwebProvider } from "thirdweb/react";
import App from "./App";
import "./index.css";
import { injectBrandCSS } from "./config/brand";

injectBrandCSS();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThirdwebProvider>
        <App />
      </ThirdwebProvider>
    </BrowserRouter>
  </React.StrictMode>
);
