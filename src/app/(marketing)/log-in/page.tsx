import { ApiError } from "@metacensus/api";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { apiClient } from "@/lib/apiClient";
import queryClient from "@/lib/queryClient";
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
      await apiClient.login(data);
      queryClient.clear();
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setLoginError(
          "We couldn't sign you in with those details. Check your email and password and try again."
        );
        return;
      }
      setLoginError(
        error instanceof Error ? error.message : "Invalid login credentials."
      );
    }
  };

  return (
    <AuthShell title="Log in.">
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

        New to MetaCensus?{" "}
          Get started
        </Link>
      </p>
        Not sure MetaCensus is for you yet?{" "}
          Talk to us
      </p>
    </AuthShell>
  );
}
