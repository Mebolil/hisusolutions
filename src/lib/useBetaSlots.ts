import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export function useBetaSlots() {
  return useQuery({
    queryKey: ["beta-slots"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_slots")
        .select("total_slots, used_slots")
        .eq("product", "kurucu-beta")
        .single();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
