import type { ReactNode } from "react";

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
        <div className="mx-auto w-full max-w-lg">
          <div className="mt-8">{children}</div>
        </div>
      </main>
  );
}
