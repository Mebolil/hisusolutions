import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { HisuLogo } from "@/components/HisuLogo";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/sifre-sifirla")({
  head: () => ({ meta: [{ title: "Şifre Sıfırlama — Pusla" }] }),
  component: SifreSifirlaPage,
});

function SifreSifirlaPage() {
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    // Race condition fix: recovery token URL'deyse ve Supabase zaten işlediyse
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setRecoveryReady(true);
          return;
        }
        timeoutId = setTimeout(() => setTimedOut(true), 8000);
      });
    } else {
      timeoutId = setTimeout(() => setTimedOut(true), 8000);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
        clearTimeout(timeoutId);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Şifreniz güncellendi, hoş geldiniz!");
      navigate({ to: "/panel" });
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
          {!recoveryReady && !timedOut && (
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Bağlantı doğrulanıyor...</p>
            </div>
          )}

          {!recoveryReady && timedOut && (
            <div className="text-center">
              <AlertCircle className="mx-auto h-14 w-14 text-orange-500" />
              <h1 className="mt-4 text-2xl font-bold">Bağlantı geçersiz veya süresi dolmuş</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Bu bağlantı artık çalışmıyor. Yeni bir bağlantı alarak tekrar deneyin.
              </p>
              <Button
                onClick={() => navigate({ to: "/auth" })}
                className="mt-6 w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:opacity-90"
              >
                Giriş sayfasına dön
              </Button>
            </div>
          )}

          {recoveryReady && (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold">Yeni şifrenizi belirleyin</h1>
                <p className="mt-2 text-sm text-muted-foreground">En az 6 karakter kullanın.</p>
              </div>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Şifre tekrar</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Şifrenizi tekrar girin"
                      className="pl-10 pr-10"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">En az 6 karakter</p>
                <Button
                  type="submit"
                  disabled={loading || password.length < 6 || password !== confirm || !confirm}
                  className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:opacity-90"
                >
                  {loading ? "Yükleniyor..." : "Şifremi Güncelle"}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 flex justify-center">
            <Link to="/auth" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
