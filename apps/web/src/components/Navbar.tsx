import { Link, NavLink, useLocation, useMatch } from "react-router";

import { discoveryReturnTo } from "../lib/discovery";
import { comparisonHref } from "../lib/comparison";

type NavbarProps = {
  onHomeExplore: () => void;
  isLaunching: boolean;
};

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `inline-flex h-full items-center border-b-2 px-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-sky-400 ${
    isActive
      ? "border-sky-300 text-sky-200"
      : "border-transparent text-slate-400 hover:text-white"
  }`;

export const Navbar = ({ onHomeExplore, isLaunching }: NavbarProps) => {
  const location = useLocation();
  const destinationMatch = useMatch("/destination/:slug");
  const returnTo = discoveryReturnTo(new URLSearchParams(location.search));
  const exploreHref = location.pathname === "/map"
    ? `${location.pathname}${location.search}${location.hash}`
    : returnTo;
  const compareHref = location.pathname === "/compare"
    ? `${location.pathname}${location.search}${location.hash}`
    : destinationMatch?.params.slug
      ? comparisonHref(destinationMatch.params.slug, returnTo)
      : "/compare";

  return (
    <header className="sticky top-0 z-40 h-[var(--navbar-height)] border-b border-slate-800 bg-[#05080f] text-slate-100">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6 md:px-10"
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
          className={navLinkClassName}
        >
          Explore
        </NavLink>
        <NavLink to={compareHref} end className={navLinkClassName}>
          Compare
        </NavLink>
      </nav>
    </header>
  );
};
