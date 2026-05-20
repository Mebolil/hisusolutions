import { Link } from "@tanstack/react-router";
import { HisuLogo } from "@/components/HisuLogo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <HisuLogo />
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              SaaS değil, AaaS. İşinize özel otomasyon, web ve finansal sistemler — anahtar teslim.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Ürünler</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/butceleme" className="hover:text-foreground">BütçeCRM</Link></li>
              <li><Link to="/web-sitesi" className="hover:text-foreground">Özel Tasarım Site</Link></li>
              <li><Link to="/otomasyon" className="hover:text-foreground">Otomasyon</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">İletişim</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:hello@hisu.solutions" className="hover:text-foreground">hello@hisu.solutions</a></li>
              <li><a href="tel:+905539003459" className="hover:text-foreground">+90 553 900 34 59</a></li>
              <li><a href="https://wa.me/905539003459" className="hover:text-foreground">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hisu Solutions. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
