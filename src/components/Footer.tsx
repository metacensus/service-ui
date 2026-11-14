import { Footer as PackageFooter, type NavLink } from "@metacensus/library-ui";
import type { ReactNode } from "react";
import { publicUrl } from "@/lib/publicUrl";

const FooterColumn = ({ title, links }: { title: string; links: NavLink[] }) => (
  <div>
    <h3 className="mb-4 font-medium">{title}</h3>
    <ul className="space-y-4">
      {links.map((link) => (
        <li key={link.href}>
          <a href={link.href} className="hover:underline">
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = ({ children }: { children?: ReactNode }) => (
  <PackageFooter
    homeHref={publicUrl("/")}
    tagline={<>&copy; 2023-{new Date().getFullYear()} MetaCensus. All rights reserved.</>}
  >
    <FooterColumn
      title="General"
      links={[
        { href: publicUrl("/"), label: "Home" },
        { href: publicUrl("/stewards"), label: "About" },
      ]}
    />
    {children}
  </PackageFooter>
);

export { Footer, FooterColumn };
