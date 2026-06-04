"use client";
import Link from "@/components/shared/Link";
import { usePathname } from "@/lib/next-navigation-compat";

type PageNavbarLink = {
  name: string;
  href: string;
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

  return (
      {links.map((link, index) => (
        <NavbarLink
          key={index}
          name={link.name}
          href={link.href}
        />
      ))}
    </div>
  );
};

export default PageNavbar;
