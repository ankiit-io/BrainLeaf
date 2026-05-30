"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignInButton, UserButton, useUser,useClerk } from "@clerk/nextjs";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Library", href: "/" },
  { label: "Add New", href: "/books/new" },
];

const Navbar = () => {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const {user} = useUser();
  return (
    <header className="w-full fixed z-50 bg-[var(--bg-primary)]">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
        <Link href="/" className="flex gap-2 items-center">
          <Image
            src="/assets/logo.png"
            alt="BrainLeaf"
            width={42}
            height={26}
          />
          <span className="logo-text">BrainLeaf</span>
        </Link>

        <nav className="w-fit flex gap-8 items-center">
          {navItems.map(({ label, href }) => {
            const isActive =
              pathname === href || (href !== "/" && pathname.startsWith(href));

            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "nav-link-base",
                  isActive ? "nav-link-active" : "text-black hover:opacity-70",
                )}
              >
                {label}
              </Link>
            );
          })}

          <div className="flex gap-7.5 items-center">
            {!isLoaded ? (
              <div className="h-8 w-8 rounded-full animate-pulse bg-gray-300" />
            ) : isSignedIn ? (
              <div className="nav-user-link">
                <UserButton />

                {user?.firstName && (
                  <Link href="/subscriptions" className="nav-user-name">
                    {user.firstName}
                  </Link>
                )}
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="nav-link-base whitespace-nowrap">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
