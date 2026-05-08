import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dvrgeihpecdbtthvianx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_b31b-1Ts3_mt4SHC4ulLRQ_o8qXAvzD";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
