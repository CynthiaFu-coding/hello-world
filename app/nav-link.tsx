"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
                                    href,
                                    children,
                                }: {
    href: string;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(href + "/");

    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border-2 px-3 py-1.5 font-bold transition ${
                active
                    ? "border-black bg-[var(--yellow)] shadow-[3px_3px_0_0_#000]"
                    : "border-transparent hover:bg-[var(--yellow)]/50"
            }`}
        >
            {children}
        </Link>
    );
}