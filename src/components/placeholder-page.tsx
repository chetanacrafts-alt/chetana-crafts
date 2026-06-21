import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  icon: LucideIcon;
  description: string;
}

export function PlaceholderPage({
  title,
  icon: Icon,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium sm:text-3xl">{title}</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-gold/15 text-brand-maroon">
            <Icon className="size-6" />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Coming in a later phase
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
