import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/pusla-helpers";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { TrendingDown, RotateCcw, Percent } from "lucide-react";
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
  cost_reversed: number;
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

const REASON_COLORS: Record<string, string> = {
  musteri_vazgecti: "#94a3b8",
  urun_hasarli: "#ef4444",
  yanlis_urun: "#f97316",
  beden_renk: "#eab308",
  gec_teslimat: "#8b5cf6",
  diger: "#6b7280",
};

type Props = {
  returns: ReturnRecord[];
  sales: Sale[];
};

export function ReturnKpiCards({ returns, sales }: Props) {
  const now = useMemo(() => new Date(), []);
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

  const totalCostReversed = monthReturns.reduce((s, r) => s + Number(r.cost_reversed || 0), 0);
  const netReturnLoss = totalReturnAmount - totalCostReversed;

  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const prevMonthReturns = returns.filter((r) => {
    try { return isWithinInterval(parseISO(r.return_date), { start: prevMonthStart, end: prevMonthEnd }); }
    catch { return false; }
  });
  const prevReturnAmount = prevMonthReturns.reduce((s, r) => s + Number(r.return_amount || 0), 0);
  const prevCostReversed = prevMonthReturns.reduce((s, r) => s + Number(r.cost_reversed || 0), 0);
  const prevNetLoss = prevReturnAmount - prevCostReversed;
  const netLossDelta = prevNetLoss > 0 ? ((netReturnLoss - prevNetLoss) / prevNetLoss) * 100 : 0;

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

  // Neden × Ay dağılımı
  const reasonTrendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthRets = returns.filter((r) => {
        try { return isWithinInterval(parseISO(r.return_date), { start, end }); }
        catch { return false; }
      });
      const entry: Record<string, string | number> = { ay: format(d, "MMM", { locale: tr }) };
      Object.keys(REASON_LABELS).forEach((key) => {
        entry[key] = monthRets.filter((r) => r.reason_category === key).length;
      });
      return entry;
    });
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
              <span className="text-sm text-muted-foreground">Net İade Zararı</span>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(netReturnLoss)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Bu ay · {netLossDelta !== 0 && (
                <span className={netLossDelta > 0 ? "text-red-500" : "text-emerald-500"}>
                  {netLossDelta > 0 ? "▲" : "▼"} %{Math.abs(netLossDelta).toFixed(1)} geçen aya göre
                </span>
              )}
            </p>
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
            <CardTitle className="text-sm font-medium">İade Nedeni × Ay Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reasonTrendData}>
                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value, name) => [value, REASON_LABELS[name as string] || name]} />
                <Legend formatter={(value) => REASON_LABELS[value] || value} />
                {Object.keys(REASON_LABELS).map((key) => (
                  <Bar key={key} dataKey={key} stackId="a" fill={REASON_COLORS[key]} name={key} radius={key === "diger" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
