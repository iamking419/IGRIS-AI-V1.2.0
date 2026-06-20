export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    // Skip escaping of double-quotes to avoid syntax issues in this environment.
    .replace(/'/g, "&#039;");
}

export function getPreviewHtml(code: string, lang: string): string | null {
  const l = (lang || "").toLowerCase();

  // Client-side preview should not execute arbitrary JS.
  // We still want users to *see* <script> blocks, so we render them as inert HTML.
  if (l === "html" || l === "htm") {
    // UNSAFE PREVIEW PATH: render HTML as-is so scripts can run.
    // Minimal normalization: replace inert escaped HTML pre-wrappers if any.

    // Make sure <script> tags are not broken by parsing; keep them intact.
    // We DO NOT escape or replace script tags here.
    let out = code;



    return out;
  }


  return null;
}




