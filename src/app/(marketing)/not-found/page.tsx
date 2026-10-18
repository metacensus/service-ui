import { LOGIN_PATH } from "@/lib/session";

export default function NotFoundPage() {
  const pathname = useLocation({ select: (l) => l.pathname });

  return (
          </h1>
            We looked for{" "}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
              Log in
          </div>
        </div>
      </main>
  );
}
