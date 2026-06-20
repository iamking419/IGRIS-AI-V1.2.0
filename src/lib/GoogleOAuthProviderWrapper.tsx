import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleOAuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use a non-empty fallback so the provider is always present.
  // If you haven't configured your real client id yet, GoogleLogin will still fail gracefully on click,
  // but the app won't crash with "must be used within GoogleOAuthProvider".
  const key =
    (import.meta as any).env?.VITE_GOOGLE_OAUTH_CLIENT_ID ||
    "__MISSING_GOOGLE_OAUTH_CLIENT_ID__";

  return <GoogleOAuthProvider clientId={key}>{children}</GoogleOAuthProvider>;
}


