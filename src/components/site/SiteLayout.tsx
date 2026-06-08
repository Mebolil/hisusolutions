import { useState, useEffect, type ReactNode, type FormEvent } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

let _exitShown = false;
let _lmShown = false;

function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (_exitShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !_exitShown) {
        _exitShown = true;
        setOpen(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from("leads").insert({ source: "exit-intent", payload: { name, phone } });
    setLoading(false);
    setSubmitted(true);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-background p-8 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        {submitted ? (
          <div className="py-6 text-center">
            <p className="text-4xl font-bold text-primary">✓</p>
            <h3 className="mt-3 text-xl font-bold">Teşekkürler!</h3>
            <p className="mt-2 text-muted-foreground">En kısa sürede sizi arıyoruz.</p>
            <button
              onClick={() => setOpen(false)}
              className="mt-5 rounded-full border border-border px-6 py-2 text-sm font-medium hover:bg-accent"
            >
              Kapat
            </button>
          </div>
        ) : (
          <>
            <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-accent-foreground">
              Ücretsiz
            </span>
            <h3 className="mt-3 text-2xl font-bold">Sizi Arayalım mı?</h3>
            <p className="mt-2 text-muted-foreground">
              İşinize uygun çözümü 15 dakikada birlikte belirleyelim.
            </p>
            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <input
                required
                placeholder="Adınız"
                value={name}
                onChange={e => setName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <input
                required
                type="tel"
                placeholder="Telefon Numaranız"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Gönderiliyor..." : "Evet, Beni Arayın"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function LeadMagnetWidget() {
  const [dismissed, setDismissed] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (_lmShown) return;
    const t = setTimeout(() => {
      _lmShown = true;
      setDismissed(false);
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => setDismissed(true);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from("leads").insert({ source: "lead-magnet", payload: { name, email } });
    setLoading(false);
    setSubmitted(true);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {open ? (
        <div className="relative w-72 rounded-3xl border border-border bg-background p-6 shadow-xl">
          <button
            onClick={() => { setOpen(false); dismiss(); }}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          {submitted ? (
            <div className="py-2 text-center">
              <p className="font-bold">Harika!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Talebiniz alındı, en kısa sürede ulaşacağız.
              </p>
              <button
                onClick={dismiss}
                className="mt-3 rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:bg-accent"
              >
                Tamam
              </button>
            </div>
          ) : (
            <>
              <p className="pr-6 text-sm font-semibold">📥 Ücretsiz Rehber</p>
              <p className="mt-1 text-xs text-muted-foreground">
                E-ticaret ROAS Hesaplama Rehberi
              </p>
              <form onSubmit={onSubmit} className="mt-3 space-y-2">
                <input
                  required
                  placeholder="Adınız"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <input
                  required
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Gönderiliyor..." : "Ücretsiz Rehberi İndir"}
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold shadow-lg transition hover:border-primary/40"
        >
          📥 Ücretsiz Rehber İndir
        </button>
      )}
    </div>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ExitIntentPopup />
      <LeadMagnetWidget />
      <a
        href="https://wa.me/905539003459?text=Merhaba, Hisu Solutions hakkında bilgi almak istiyorum."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
        aria-label="WhatsApp ile iletişime geç"
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}
