import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { SyncBadge } from "./sync-badge";
import { MobileNav } from "./mobile-nav";
import { DesktopNav } from "./desktop-nav";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <SyncBadge />
          <form action={logout}>
            <Button type="submit" variant="ghost" size="icon-sm">
              <LogOut className="size-3.5" />
              <span className="sr-only">Log out</span>
            </Button>
          </form>
          <MobileNav />
        </div>
      </div>
      <DesktopNav />
    </header>
  );
}
