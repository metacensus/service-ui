// Thin adapter so files that imported the default `next/link` component keep
// working: it maps `href` -> TanStack Router's `to` and forwards everything
// else (className, children, onClick, target, ...).

import { Link as RouterLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
  // next/link props that are no-ops here:
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
};

export default function Link({
  href,
  children,
  prefetch: _prefetch,
  scroll: _scroll,
  passHref: _passHref,
  legacyBehavior: _legacyBehavior,
  replace,
  ...rest
}: LinkProps) {
  const isExternal =
    /^https?:\/\//.test(href) ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    rest.target === "_blank";

  if (isExternal) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={href} replace={replace} {...rest}>
      {children}
    </RouterLink>
  );
}
