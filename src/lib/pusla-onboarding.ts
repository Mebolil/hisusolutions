import { useEffect, useState } from "react";

// Onboarding profil tipi ve localStorage yönetimi

export type OnboardingSector = "eticaret" | "karma" | "perakende" | "hizmet";
export type OnboardingRevenue = "<50k" | "50k-250k" | "250k-1m" | ">1m";
export type OnboardingFocus = "satislar" | "giderler" | "reklam" | "stok";

export type OnboardingProfile = {
  completed: boolean;
  sector: OnboardingSector;
  revenueRange: OnboardingRevenue;
  focus: OnboardingFocus;
  completedAt: string; // ISO date string
};

// One-time migration: butcecrm → pusla localStorage keys
if (typeof window !== "undefined") {
  const OLD_KEY = "butcecrm:onboarding:v1";
  const NEW_KEY = "pusla:onboarding:v1";
  const old = localStorage.getItem(OLD_KEY);
  if (old && !localStorage.getItem(NEW_KEY)) {
    localStorage.setItem(NEW_KEY, old);
    localStorage.removeItem(OLD_KEY);
  }
}

const KEY = "pusla:onboarding:v1";
const EVENT = "pusla:onboarding-changed";

export function isOnboardingComplete(): boolean {
  const p = loadOnboarding();
  return !!p?.completed;
}

export function loadOnboarding(): OnboardingProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<OnboardingProfile>;
    if (!p || typeof p !== "object" || !p.completed) return null;
    return {
      completed: true,
      sector: (p.sector ?? "eticaret") as OnboardingSector,
      revenueRange: (p.revenueRange ?? "<50k") as OnboardingRevenue,
      focus: (p.focus ?? "satislar") as OnboardingFocus,
      completedAt: p.completedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveOnboarding(
  p: Omit<OnboardingProfile, "completed" | "completedAt">,
): OnboardingProfile {
  const profile: OnboardingProfile = {
    ...p,
    completed: true,
    completedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent(EVENT));
  }
  return profile;
}

export function useOnboarding(): [
  OnboardingProfile | null,
  (p: Omit<OnboardingProfile, "completed" | "completedAt">) => OnboardingProfile,
] {
  const [profile, setProfile] = useState<OnboardingProfile | null>(() => loadOnboarding());
  useEffect(() => {
    const onChange = () => setProfile(loadOnboarding());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  const save = (p: Omit<OnboardingProfile, "completed" | "completedAt">) => {
    const next = saveOnboarding(p);
    setProfile(next);
    return next;
  };
  return [profile, save];
}

// Sektöre göre önerilen gider kategorileri döner (DEFAULT_SETTINGS'e dokunmaz)
export function getDefaultCategoriesForSector(sector: OnboardingSector): string[] {
  switch (sector) {
    case "eticaret":
      return ["Reklam", "Komisyon", "Kargo", "Paketleme", "Ürün Maliyeti", "Vergi"];
    case "karma":
      return ["Reklam", "Komisyon", "Kargo", "Kira", "Personel", "Ürün Maliyeti", "Vergi"];
    case "perakende":
      return ["Kira", "Elektrik", "Personel", "Ürün Maliyeti", "Vergi", "Muhasebe"];
    case "hizmet":
      return ["Kira", "Personel", "İnternet", "Muhasebe", "Reklam", "Vergi"];
    default:
      return [];
  }
}

// Focus'a göre dashboard kart sıralaması için öncelik puanı döner
export function getFocusPriority(
  focus: OnboardingFocus,
): { metric: number; campaign: number; stock: number; expense: number } {
  switch (focus) {
    case "satislar":
      return { metric: 3, campaign: 1, stock: 0, expense: 0 };
    case "giderler":
      return { metric: 1, campaign: 0, stock: 0, expense: 3 };
    case "reklam":
      return { metric: 1, campaign: 3, stock: 0, expense: 0 };
    case "stok":
      return { metric: 1, campaign: 0, stock: 3, expense: 0 };
    default:
      return { metric: 0, campaign: 0, stock: 0, expense: 0 };
  }
}
