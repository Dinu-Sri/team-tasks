import Image from "next/image";
import Link from "next/link";

export function AuthLogo() {
  return (
    <Link href="/" aria-label="Tuduvia home" className="mb-5 inline-flex items-center justify-center">
      <Image src="/tuduvia-logo.webp" alt="Tuduvia" width={150} height={52} className="h-12 w-auto object-contain" priority />
    </Link>
  );
}
