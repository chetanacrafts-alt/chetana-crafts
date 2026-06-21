import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <span className="relative flex size-10 shrink-0 items-center justify-center">
        <Image
          src="/logo-icon.png"
          alt="Chetana Crafts"
          fill
          sizes="40px"
          className="object-contain"
          priority
        />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-base font-medium tracking-tight text-brand-maroon-dark sm:text-lg">
          Chetana Crafts
        </span>
        <span className="hidden text-[0.7rem] font-medium tracking-wide text-brand-gold uppercase sm:block">
          Handcrafted Chaniya Choli
        </span>
      </span>
    </Link>
  );
}
