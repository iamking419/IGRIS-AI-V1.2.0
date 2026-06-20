import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./lib/index.css";
import GoogleOAuthProviderWrapper from "./lib/GoogleOAuthProviderWrapper";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProviderWrapper>
      <App />
    </GoogleOAuthProviderWrapper>
  </StrictMode>
);

