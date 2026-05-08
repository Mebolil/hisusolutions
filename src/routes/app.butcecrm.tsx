import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ButceCrmLayout } from "@/components/butcecrm/AppLayout";

export const Route = createFileRoute("/app/butcecrm")({
  head: () => ({
    meta: [
      { title: "BütçeCRM — Ana Sayfa" },
      { name: "description", content: "BütçeCRM finansal otomasyon paneli." },
    ],
  }),
  component: () => (
    <ButceCrmLayout>
      <Outlet />
    </ButceCrmLayout>
  ),
});
