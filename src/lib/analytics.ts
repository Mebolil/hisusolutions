import { supabase } from "./supabase";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function getSessionId(): string {
  const key = "hisu_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function trackPageView(path: string) {
  // GTM dataLayer push
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: "page_view", page_path: path });

  // Supabase page_views tablosuna yaz — fire-and-forget
  supabase.from("page_views").insert({
    session_id: getSessionId(),
    page_path: path,
    referrer: document.referrer || null,
  }).then(() => {});
}
