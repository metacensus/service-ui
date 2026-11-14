import { Header } from "@metacensus/library-ui";
import type { ReactNode } from "react";
import { publicUrl } from "@/lib/publicUrl";
import { Footer } from "@/components/Footer";

export const authLink =
  "text-mc-ink-accent underline underline-offset-4 hover:no-underline";

export const fieldError = (error?: { message?: string }) =>
  error && <span role="alert">{error.message}</span>;

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header homeHref={publicUrl("/")} />
      <main className="flex-1 px-4 py-14 lg:py-20">
        <div className="mx-auto w-full max-w-lg">
          <h1 className="text-4xl font-medium sm:text-5xl">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
