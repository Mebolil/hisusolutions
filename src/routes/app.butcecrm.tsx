import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ButceCrmLayout } from "@/components/butcecrm/AppLayout";
import { OnboardingFlow } from "@/components/butcecrm/OnboardingFlow";
import { isOnboardingComplete } from "@/lib/butcecrm-onboarding";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/butcecrm")({
  head: () => ({
    meta: [
      { title: "BütçeCRM — Ana Sayfa" },
      { name: "description", content: "BütçeCRM finansal otomasyon paneli." },
    ],
  }),
  component: ButceCrmGuard,
});

const ALLOWED_PLANS = ["butcecrm", "butceleme", "pro", "enterprise", "trial"];

function ButceCrmGuard() {
  const [ready, setReady] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate({ to: "/auth" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, trial_ends_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const raw = (profile as any)?.plan ?? "";
      const plans: string[] = Array.isArray(raw) ? raw : raw.split(",").map((s: string) => s.trim());
      const ends: string | null = (profile as any)?.trial_ends_at ?? null;

      const hasPlan = plans.some(p => ALLOWED_PLANS.includes(p));
      const isTrial = plans.includes("trial");
      const trialExpired = isTrial && ends !== null && new Date(ends) <= new Date();

      if (!hasPlan || trialExpired) {
        navigate({ to: "/panel" });
        return;
      }

      setTrialEndsAt(ends);
      if (!isOnboardingComplete()) setShowOnboarding(true);
      setReady(true);
    })();
  }, [navigate]);

  if (!ready) return null;

  return (
    <>
      <ButceCrmLayout trialEndsAt={trialEndsAt}>
        <Outlet />
      </ButceCrmLayout>
      {showOnboarding && (
        <OnboardingFlow open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  );
}
