import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface KazanilmamisFirsatKartProps {
  bosReklam: number;
  iadeMaliyeti: number;
  negatifMarjin: number;
  total: number;
  formatCurrency: (n: number) => string;
}

export function KazanilmamisFirsatKart({
  bosReklam,
  iadeMaliyeti,
  negatifMarjin,
  total,
  formatCurrency,
}: KazanilmamisFirsatKartProps) {
  return (
    <Card className="border-2 border-amber-400 bg-amber-50/40 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-amber-600" />
          Kazanılmamış Fırsat
        </CardTitle>
        <p className="text-xs text-muted-foreground">Önlem alınabilecek alan</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold text-amber-700">{formatCurrency(total)}</p>

        <div className="space-y-2">
          {bosReklam > 0 ? (
            <a href="/app/pusla/reklam" className="flex items-center justify-between text-sm hover:underline decoration-current">
              <span className="text-muted-foreground">Düşük verimli reklam</span>
              <span className="font-medium">{formatCurrency(bosReklam)} <span className="text-xs">→</span></span>
            </a>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Düşük verimli reklam</span>
              <span className="font-medium">-</span>
            </div>
          )}
          {iadeMaliyeti > 0 ? (
            <a href="/app/pusla/iadeler" className="flex items-center justify-between text-sm hover:underline decoration-current">
              <span className="text-muted-foreground">İade etkisi</span>
              <span className="font-medium">{formatCurrency(iadeMaliyeti)} <span className="text-xs">→</span></span>
            </a>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">İade etkisi</span>
              <span className="font-medium">-</span>
            </div>
          )}
          {negatifMarjin > 0 ? (
            <a href="/app/pusla/satislar" className="flex items-center justify-between text-sm hover:underline decoration-current">
              <span className="text-muted-foreground">Zarar eden satışlar</span>
              <span className="font-medium">{formatCurrency(negatifMarjin)} <span className="text-xs">→</span></span>
            </a>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Zarar eden satışlar</span>
              <span className="font-medium">-</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground pt-1">
          Bu tutarlar analiz amacıyla hesaplanmıştır. Karar işletme sahibine aittir.
        </p>
      </CardContent>
    </Card>
  );
}
