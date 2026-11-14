import { Button, Header } from "@metacensus/library-ui";
import { useLocation } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { publicUrl } from "@/lib/publicUrl";
import { LOGIN_PATH } from "@/lib/session";

export default function NotFoundPage() {
  const pathname = useLocation({ select: (l) => l.pathname });

  return (
    <div className="flex min-h-screen flex-col">
      <Header homeHref={publicUrl("/")} />
      <main className="flex-1 px-4 py-16 lg:py-24">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-sm font-medium">404 · Page not found</p>
          <h1 className="mt-6 text-5xl font-medium sm:text-7xl">
            No evidence for this page.
          </h1>
          <p className="mt-8 text-xl leading-relaxed">
            We looked for{" "}
            <code className="break-all font-mono text-base">{pathname}</code>{" "}
            and came up empty. The link may be old, or the address may have a
            typo.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href={publicUrl("/")}>Back to the home page</Button>
            <Button href={LOGIN_PATH} variant="secondary">
              Log in
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
