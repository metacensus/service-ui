import { Link } from "@tanstack/react-router";
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
    formState: { errors, isSubmitting },
    register,
    handleSubmit,
    watch,
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
            {...register("email", { required: "Email is required" })}
          />

            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            {...register("password", { required: "Password is required" })}
          />


          type="submit"
          disabled={!watch("email") || !watch("password") || isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Log in"}
      </form>

        Not sure MetaCensus is for you yet?{" "}
          Talk to us
      </p>
    </AuthShell>
  );
}
