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
          <MobileNav />
        </div>
      </div>
      <DesktopNav />
    </header>
  );
}
