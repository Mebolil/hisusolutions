import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, Mail, Zap } from "lucide-react";
import { supabase, REMEMBER_ME_KEY } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Giriş Yap — Hisu Solutions" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else { toast.success("Giriş başarılı"); navigate({ to: "/panel" }); }
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      if (error) toast.error(error.message);
      else toast.success("Kayıt oluşturuldu! E-postanızı kontrol edin.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Zap className="h-5 w-5" /></span>
          <span className="font-display text-lg font-bold">Hisu Solutions</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold">{mode === "signin" ? "Giriş Yap" : "Kayıt Ol"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin" ? "Hesabınıza giriş yaparak otomasyonlarınızı yönetin" : "Yeni bir hesap oluşturun"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
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
                <Input id="password" type="password" placeholder="En az 6 karakter" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:opacity-90">
              {loading ? "Yükleniyor..." : mode === "signin" ? "Giriş Yap" : "Kayıt Ol"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-primary hover:underline">
              {mode === "signin" ? "Kayıt Ol" : "Giriş Yap"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
