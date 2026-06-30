import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Mail, CheckCircle, Eye, EyeOff, User } from "lucide-react";
import { HisuLogo } from "@/components/HisuLogo";
import { supabase, REMEMBER_ME_KEY } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => ({
    mode: (search.mode as "signin" | "signup") ?? "signin",
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "confirmation">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  // Email doğrulama linkinden dönen kullanıcıyı panele yönlendir
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate({ to: "/panel" });
      }
      // PASSWORD_RECOVERY eventi kasıtlı yakalanmıyor — /sifre-sifirla route'u halleder
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const titles: Record<string, string> = {
      signin: "Giriş Yap — Hisu Solutions",
      signup: "Kayıt Ol — Hisu Solutions",
      confirmation: "Kayıt Tamamlandı — Hisu Solutions",
    };
    document.title = titles[mode] ?? "Hisu Solutions";
  }, [mode]);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-sifirla`,
    });
    // Güvenlik gereği: hata da olsa success da olsa "gönderildi" göster
    // Email enumeration saldırısını engeller
    setForgotSent(true);
    setLoading(false);
  };

  const resetForgot = () => {
    setForgotMode(false);
    setForgotSent(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signin") {
      // Storage seçimini sign-in çağrısından önce ayarla
      window.localStorage.setItem(REMEMBER_ME_KEY, remember ? "true" : "false");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else { toast.success("Giriş başarılı"); navigate({ to: "/panel" }); }
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: name } },
      });
      if (error) toast.error(error.message);
      else setMode("confirmation");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
        <Link to="/">
          <HisuLogo />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10">
          {mode === "confirmation" ? (
            <div className="text-center">
              <CheckCircle className="mx-auto h-14 w-14 text-green-500" />
              <h1 className="mt-4 text-2xl font-bold">E-postanızı doğrulayın</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Kayıt e-postası gönderildi. Gelen kutunuzu kontrol edin.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Spam klasörünü de kontrol edin.</p>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                ← Giriş sayfasına dön
              </button>
            </div>
          ) : forgotMode ? (
            forgotSent ? (
              <div className="text-center">
                <CheckCircle className="mx-auto h-14 w-14 text-green-500" />
                <h1 className="mt-4 text-2xl font-bold">Bağlantı yolda!</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Gelen kutunuzu kontrol edin. Gelmezse spam klasörünü de kontrol edin.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">Bağlantı 1 saat geçerlidir.</p>
                <button
                  type="button"
                  onClick={resetForgot}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  ← Giriş sayfasına dön
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h1 className="text-3xl font-bold">Şifrenizi sıfırlayalım.</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    E-posta adresinize bağlantı gönderiyoruz — birkaç dakika içinde girişte olursunuz.
                  </p>
                </div>
                <form onSubmit={handleForgot} className="mt-8 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email">E-posta</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="forgot-email" type="email" placeholder="ornek@email.com" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:opacity-90">
                    {loading ? "Yükleniyor..." : "Bağlantı Gönder"}
                  </Button>
                </form>
                <p className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={resetForgot}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    ← Giriş sayfasına dön
                  </button>
                </p>
              </>
            )
          ) : (
          <>
          <div className="text-center">
            <h1 className="text-3xl font-bold">{mode === "signin" ? "Giriş Yap" : "30 Gün Ücretsiz Dene"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Hesabınıza giriş yaparak paneli açın"
                : "Kart gerekmez · Anında erişim · 30 gün boyunca tüm özellikler açık"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Ad Soyad</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" placeholder="Ad Soyad" className="pl-10" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="ornek@email.com" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="En az 6 karakter"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {mode === "signup" && password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[0-9]/.test(password),
                  ].map((met, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${met ? "bg-green-500" : "bg-muted"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                    ? "Güçlü şifre"
                    : "En az 8 karakter, büyük harf ve rakam ekleyin"}
                </p>
              </div>
            )}
            {mode === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-sm text-foreground/70 hover:text-primary transition-colors"
                >
                  Şifremi unuttum
                </button>
              </div>
            )}
            {mode === "signin" && (
              <label htmlFor="remember" className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                Beni Hatırla
              </label>
            )}
            <Button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:opacity-90">
              {loading ? "Yükleniyor..." : mode === "signin" ? "Giriş Yap" : "30 Gün Ücretsiz Başla"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-primary hover:underline">
              {mode === "signin" ? "30 Gün Ücretsiz Başla" : "Giriş Yap"}
            </button>
          </p>
          </>
          )}
        </div>
      </main>
    </div>
  );
}
