import { useEffect, useState } from "react";

export type InstallmentPlan = { count: number; rate: number };
export type PaymentMethod = { name: string; isCreditCard: boolean; rate?: number };

export type AppSettings = {
  platforms: string[];
  carriers: string[];
  orderStatuses: string[];
  paymentMethods: PaymentMethod[];
  installmentPlans: InstallmentPlan[];
};

export const DEFAULT_SETTINGS: AppSettings = {
  platforms: ["Trendyol", "Hepsiburada", "Amazon", "N11", "Kendi Sitem"],
  carriers: ["Yurtiçi Kargo", "MNG Kargo", "Aras Kargo", "PTT Kargo", "Sürat Kargo"],
  orderStatuses: ["Hazırlanıyor", "Kargoda", "Teslim Edildi", "İptal", "İade"],
  paymentMethods: [
    { name: "Kredi Kartı", isCreditCard: true },
    { name: "Havale/EFT", isCreditCard: false },
    { name: "Kapıda Ödeme", isCreditCard: false },
    { name: "Nakit", isCreditCard: false },
    { name: "Çek/Senet", isCreditCard: false },
  ],
  installmentPlans: [
    { count: 1, rate: 0 },
    { count: 2, rate: 1.5 },
    { count: 3, rate: 2.5 },
    { count: 6, rate: 5 },
    { count: 9, rate: 7.5 },
    { count: 12, rate: 10 },
  ],
};

const KEY = "butcecrm:settings:v1";
const EVENT = "butcecrm:settings-changed";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useSettings(): [AppSettings, (s: AppSettings) => void] {
  const [s, setS] = useState<AppSettings>(() => loadSettings());
  useEffect(() => {
    const onChange = () => setS(loadSettings());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  const update = (next: AppSettings) => {
    saveSettings(next);
    setS(next);
  };
  return [s, update];
}
