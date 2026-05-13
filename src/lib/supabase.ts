import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dvrgeihpecdbtthvianx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_b31b-1Ts3_mt4SHC4ulLRQ_o8qXAvzD";

export const REMEMBER_ME_KEY = "sb-remember-me";

// Custom storage: localStorage when "Beni Hatırla" is true (kalıcı),
// sessionStorage when false (tarayıcı kapanınca biter).
const hybridStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    const remember = window.localStorage.getItem(REMEMBER_ME_KEY) !== "false";
    if (remember) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: hybridStorage,
  },
});
