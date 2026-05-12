import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { FolderOpen, FilePlus, LayoutGrid, Sparkles, Settings } from "lucide-react";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/home")({ component: HomePage });

function HomePage() {
  const { t } = useLang();

  const tiles = [
    { to: "/scribe", icon: FilePlus, label: t("New Scribe", "บันทึกใหม่") },
    { to: "/saved", icon: FolderOpen, label: t("Saved", "บันทึกแล้ว") },
    { to: "/templates", icon: LayoutGrid, label: t("Templates", "เทมเพลต") },
    { to: "/ai-assistant", icon: Sparkles, label: t("AI Assistant", "ผู้ช่วย AI") },
    { to: "/profile", icon: Settings, label: t("Profile", "โปรไฟล์") },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">Scribe Mate</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Welcome back. What would you like to do?", "ยินดีต้อนรับ คุณต้องการทำอะไร?")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <Link key={tile.to} to={tile.to}>
            <Card className="p-5 flex flex-col items-center gap-2 hover:border-primary hover:shadow-soft transition">
              <div className="size-12 grid place-items-center rounded-xl bg-gradient-primary text-white">
                <tile.icon className="size-6" />
              </div>
              <span className="text-sm font-medium text-center">{tile.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
