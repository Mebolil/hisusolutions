import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface KayipKarKartProps {
  bosReklam: number;
  iadeMaliyeti: number;
  negatifMarjin: number;
  total: number;
  formatCurrency: (n: number) => string;
}

export function KayipKarKart({
  bosReklam,
  iadeMaliyeti,
  negatifMarjin,
  total,
  formatCurrency,
}: KayipKarKartProps) {
  return (
    <Card className="border-2 border-amber-400 bg-amber-50/40 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-amber-600" />
          Bu Dönem Dikkat Gerektiren Alan
        </CardTitle>
        <p className="text-xs text-muted-foreground">Geri alınabilir kâr fırsatı</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold text-amber-700">₺{formatCurrency(total)}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Boşa giden reklam harcaması</span>
            <span className="font-medium">{bosReklam > 0 ? formatCurrency(bosReklam) : "-"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">İade maliyeti</span>
            <span className="font-medium">{iadeMaliyeti > 0 ? formatCurrency(iadeMaliyeti) : "-"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Negatif marjin ürünler</span>
            <span className="font-medium">{negatifMarjin > 0 ? formatCurrency(negatifMarjin) : "-"}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-1">
          Bu tutarlar analiz amacıyla hesaplanmıştır. Karar işletme sahibine aittir.
        </p>
      </CardContent>
    </Card>
  );
}
