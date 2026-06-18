import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/butcecrm-helpers";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingDown, Package, RotateCcw, Percent } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { tr } from "date-fns/locale";

type ReturnRecord = {
  id: string;
  return_date: string;
  return_amount: number;
  quantity: number;
  product_name: string;
  reason_category: string;
  status: string;
};

type Sale = {
  id: string;
  sale_date: string;
  total_amount: number;
  quantity: number;
};

const REASON_LABELS: Record<string, string> = {
  musteri_vazgecti: "Müşteri Vazgeçti",
  urun_hasarli: "Ürün Hasarlı",
  yanlis_urun: "Yanlış Ürün",
  beden_renk: "Boyut / Renk",
  gec_teslimat: "Geç Teslimat",
  diger: "Diğer",
};

const PIE_COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6"];

type Props = {
  returns: ReturnRecord[];
  sales: Sale[];
};

export function ReturnKpiCards({ returns, sales }: Props) {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const monthReturns = returns.filter((r) => {
    try {
      return isWithinInterval(parseISO(r.return_date), { start: currentMonthStart, end: currentMonthEnd });
    } catch { return false; }
  });

  const monthSales = sales.filter((s) => {
    try {
      return isWithinInterval(parseISO(s.sale_date), { start: currentMonthStart, end: currentMonthEnd });
    } catch { return false; }
  });

  const totalReturnAmount = monthReturns.reduce((s, r) => s + Number(r.return_amount || 0), 0);
  const totalReturnCount = monthReturns.length;
  const totalSalesAmount = monthSales.reduce((s, x) => s + Number(x.total_amount || 0), 0);
  const totalSalesCount = monthSales.length;

  const returnRateAmount = totalSalesAmount > 0 ? (totalReturnAmount / totalSalesAmount) * 100 : 0;
  const returnRateCount = totalSalesCount > 0 ? (totalReturnCount / totalSalesCount) * 100 : 0;

  const topReturnedProduct = useMemo(() => {
    const map = new Map<string, number>();
    returns.forEach((r) => map.set(r.product_name, (map.get(r.product_name) ?? 0) + r.quantity));
    let top = "";
    let max = 0;
    map.forEach((qty, name) => { if (qty > max) { max = qty; top = name; } });
    return top || "—";
  }, [returns]);

  // Son 6 ay aylık iade tutarı
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const total = returns
        .filter((r) => {
          try { return isWithinInterval(parseISO(r.return_date), { start, end }); }
          catch { return false; }
        })
        .reduce((s, r) => s + Number(r.return_amount || 0), 0);
      return { ay: format(d, "MMM", { locale: tr }), tutar: total };
    });
  }, [returns]);

  // Neden dağılımı
  const reasonData = useMemo(() => {
    const map = new Map<string, number>();
    returns.forEach((r) => map.set(r.reason_category, (map.get(r.reason_category) ?? 0) + 1));
    return Array.from(map.entries()).map(([key, value]) => ({
      name: REASON_LABELS[key] || key,
      value,
    }));
  }, [returns]);

  return (
    <div className="space-y-6">
      {/* 4 KPI Kartı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">İade Sayısı</span>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{totalReturnCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Bu ay</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">İade Tutarı</span>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalReturnAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">Bu ay</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">İade Oranı</span>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{returnRateAmount.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tutar bazında · {returnRateCount.toFixed(1)}% adet bazında
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">En Çok İade</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-base font-bold truncate">{topReturnedProduct}</p>
            <p className="text-xs text-muted-foreground mt-1">Tüm zamanlar</p>
          </CardContent>
        </Card>
      </div>

      {/* 2 Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aylık İade Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="tutar" name="İade Tutarı" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">İade Nedeni Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {reasonData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Henüz iade nedeni yok
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={reasonData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                  >
                    {reasonData.map((item, i) => (
                      <Cell key={item.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
