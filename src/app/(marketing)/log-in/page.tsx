import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { useRouter } from "@/lib/next-navigation-compat";

type LogInFormInputs = {
  email: string;
  password: string;
};

export default function LogIn() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LogInFormInputs>();
  const {
  } = form;

  const onSubmit: SubmitHandler<LogInFormInputs> = async (data) => {
    setLoginError(null);
    try {
      router.push("/dashboard");
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Invalid login credentials."
      );
    }
  };

  return (
            type="email"
            autoComplete="email"
            placeholder="you@organization.org"
          />

            type="password"
          />


        >
      </form>
  );
}
