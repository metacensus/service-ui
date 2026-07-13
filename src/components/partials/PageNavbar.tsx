"use client";
import Link from "@/components/shared/Link";
import { usePathname } from "@/lib/next-navigation-compat";

type PageNavbarLink = {
  name: string;
  href: string;
  activePrefix?: string;
};

type PageNavbarProps = {
  links: PageNavbarLink[];
};

const NavbarLink = ({
  name,
  href,
  isActive,
}: {
  name: string;
  href: string;
  isActive: boolean;
}) => {
  return (
    <Link href={href} className="w-full min-w-1/2 flex-1">
      <span>
        <div
          }`}
        >
          <span>{name}</span>
        </div>
      </span>
    </Link>
  );
};

const PageNavbar = ({ links }: PageNavbarProps) => {
  const pathName = usePathname();
  const activeHref = links
    .map((link) => ({
      link,
      matchPath: link.activePrefix ?? link.href,
    }))
    .filter(
      ({ matchPath }) =>
        pathName === matchPath || pathName.startsWith(`${matchPath}/`)
    )
    .sort((a, b) => b.matchPath.length - a.matchPath.length)[0]?.link.href;

  return (
      {links.map((link, index) => (
        <NavbarLink
          key={index}
          name={link.name}
          href={link.href}
          isActive={activeHref === link.href}
        />
      ))}
    </div>
  );
};

export default PageNavbar;
