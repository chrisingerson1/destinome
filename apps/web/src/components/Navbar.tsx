import { Link, NavLink, useLocation } from "react-router";

import { discoveryReturnTo } from "../lib/discovery";

type NavbarProps = {
  onHomeExplore: () => void;
  isLaunching: boolean;
};

export const Navbar = ({ onHomeExplore, isLaunching }: NavbarProps) => {
  const location = useLocation();
  const exploreHref = location.pathname === "/map"
    ? `${location.pathname}${location.search}${location.hash}`
    : discoveryReturnTo(new URLSearchParams(location.search));

  return (
    <header className="sticky top-0 z-40 h-[var(--navbar-height)] border-b border-slate-800 bg-[#05080f] text-slate-100">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-full max-w-7xl items-center gap-8 px-6 md:px-10"
      >
        <Link
          to="/"
          aria-label="Destinome home"
          className="inline-flex h-11 shrink-0 items-center text-base font-bold tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
        >
          Destinome
        </Link>
        <NavLink
          to={exploreHref}
          end
          preventScrollReset
          aria-busy={isLaunching || undefined}
          onClick={(event) => {
            if (
              location.pathname !== "/" ||
              event.button !== 0 ||
              event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
            ) return;

            event.preventDefault();
            onHomeExplore();
          }}
          className={({ isActive }) =>
            `inline-flex h-full items-center border-b-2 px-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-sky-400 ${
              isActive
                ? "border-sky-300 text-sky-200"
                : "border-transparent text-slate-400 hover:text-white"
            }`
          }
        >
          Explore
        </NavLink>
      </nav>
    </header>
  );
};
