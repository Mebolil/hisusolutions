import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ADMIN_EMAIL = "hatamelih245@gmail.com";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const PLANS = ["trial", "butcecrm", "web", "otomasyon", "pro", "enterprise"];

interface UserProfile {
  user_id: string;
  email: string;
  plan: string;
  trial_ends_at: string | null;
  created_at: string;
}

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [planSelections, setPlanSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        navigate({ to: "/" });
        return;
      }

      const token = session.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-users?action=list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error("Kullanıcılar yüklenemedi"); setLoading(false); return; }
      const data = await res.json();
      setUsers(data);
      const sel: Record<string, string> = {};
      data.forEach((u: UserProfile) => { sel[u.user_id] = u.plan ?? "trial"; });
      setPlanSelections(sel);
      setLoading(false);
    })();
  }, []);

  async function updatePlan(userId: string) {
    const plan = planSelections[userId];
    setUpdating(userId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-users?action=update-plan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session!.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, plan }),
    });
    if (res.ok) {
      toast.success("Plan güncellendi");
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, plan } : u));
    } else {
      toast.error("Güncelleme başarısız");
    }
    setUpdating(null);
  }

  async function handleResetPassword(email: string, userId: string) {
    setResetting(userId);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-sifirla`,
    });
    if (error) toast.error("E-posta gönderilemedi, lütfen tekrar deneyin");
    else toast.success("Şifre sıfırlama e-postası gönderildi");
    setResetting(null);
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      Yükleniyor…
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white">
      <h1 className="mb-6 text-2xl font-bold">Admin — Kullanıcılar</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-left text-gray-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Mevcut Plan</th>
              <th className="px-4 py-3">Trial Bitiş</th>
              <th className="px-4 py-3">Kayıt</th>
              <th className="px-4 py-3">Güncelle</th>
              <th className="px-4 py-3">Şifre</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-blue-300">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{u.plan ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString("tr-TR") : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(u.created_at).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-lg border border-white/10 bg-gray-800 px-2 py-1 text-xs text-white"
                      value={planSelections[u.user_id] ?? u.plan ?? "trial"}
                      onChange={e => setPlanSelections(prev => ({ ...prev, [u.user_id]: e.target.value }))}
                    >
                      {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button
                      onClick={() => updatePlan(u.user_id)}
                      disabled={updating === u.user_id}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {updating === u.user_id ? "…" : "Kaydet"}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleResetPassword(u.email, u.user_id)}
                    disabled={resetting === u.user_id}
                    className="rounded-lg bg-blue-700 px-3 py-1 text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
                  >
                    {resetting === u.user_id ? "…" : "Şifre Sıfırla"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
