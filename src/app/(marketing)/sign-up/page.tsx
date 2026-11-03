import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { apiClient } from "@/lib/apiClient";
import { PasskeyError, registerPasskey } from "@/lib/passkey";
import queryClient from "@/lib/queryClient";
import { LOGIN_PATH } from "@/lib/session";
import { ApiError } from "@metacensus/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLoaderData } from "@tanstack/react-router";
import { useRouter } from "@/lib/next-navigation-compat";
import owasp from "owasp-password-strength-test";
import { useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { countryOptions, isCountryCode } from "@/lib/countries";

const SignUpFormSchema = z
  .object({
    name: z
      .string({
        required_error: "Name is required",
      })
      .min(2, { message: "Name is too short" }),
    email: z
      .string({
        required_error: "Email is required",
      })
      .email(),
    // The ISO 3166-1 alpha-2 code, not the name — see `@/lib/countries`.
    country: z
      .string({
        required_error: "Country is required",
      })
      .refine(isCountryCode, { message: "Country is required" }),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(10, { message: "Password is too short" })
      .max(72, { message: "Password is too long" }),
    passwordConfirmation: z.string({
      required_error: "Password confirmation is required",
    }),
    verify: z.boolean({
      required_error: "You must verify the information",
    }),
  })
  .refine((data) => data.passwordConfirmation === data.password, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  })
  .superRefine(({ password }, ctx) => {
    const passwordStrengthResult = owasp.test(password);
    if (passwordStrengthResult.errors.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: passwordStrengthResult.errors.join("||"),
        path: ["password"],
      });
    }
  });

type SignUpFormInputs = z.infer<typeof SignUpFormSchema>;

// Built once at module load: the list is 250 entries and does not vary.
const countryList = countryOptions();

/** A second registration replaces the stored passkey, so only the first submit registers. */
export async function submitSignUp(
  registered: { current: boolean },
  { name, email, country, password }: SignUpFormInputs
): Promise<void> {
  if (!registered.current) {
    await registerPasskey({ name, email });
    registered.current = true;
  }
  await apiClient.signUp({ content: { name, email, country }, password });
}

export function signUpNotice(error: unknown): { text: string; isError: boolean } {
  if (error instanceof PasskeyError) {
  }
  if (error instanceof ApiError) {
    return { text: "We couldn't create your account. Check your details and try again.", isError: true };
  }
  return {
    text: error instanceof Error ? error.message : "There was a problem with your request.",
    isError: true,
  };
}

export default function SignUp() {
  const router = useRouter();
  const passkey = useLoaderData({ from: "/sign-up" });
  const registered = useRef(false);
  const [notice, setNotice] = useState<ReturnType<typeof signUpNotice>>();

  const form = useForm<SignUpFormInputs>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      country: "",
      password: "",
      passwordConfirmation: "",
      verify: false,
    },
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<SignUpFormInputs> = async (data) => {
    setNotice(undefined);
    try {
      await submitSignUp(registered, data);
    } catch (error) {
      setNotice(signUpNotice(error));
      return;
    }
    queryClient.clear();
    router.push("/dashboard");
  };

  return (
    <AuthShell title="Get started.">
      <Form {...form}>
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              {...form.register("name", { required: true })}
            />

              type="email"
              autoComplete="email"
              placeholder="you@organization.org"
              {...form.register("email", { required: true })}
            />
            {passkey && (
                This device already has a passkey, and registering replaces it. If you have an account,{" "}
                  log in
                </Link>{" "}
                instead.
              </p>
            )}

              autoComplete="country"
              {...form.register("country", { required: true })}
            >
              <option value="">Select a country</option>
              {countryList.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}

              type="password"
              autoComplete="new-password"
              placeholder="Your password"
              {...form.register("password", { required: true })}
            />

              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              {...form.register("passwordConfirmation", { required: true })}
            />

              Registering asks your device twice: once to create the passkey,
              then once to sign with it.
            </p>
              MetaCensus creates a passkey for each contributor, used to
              attribute the data you contribute. It is stored on this device,
              not on our servers, so we cannot help you recover it if it is lost.
            </p>
              Before proceeding, please verify the following:
            </p>
              <li>I am using a secure computer that is not shared with others</li>
              <li>I am not using incognito or private mode in my browser</li>
            </ul>

            <FormField
              control={form.control}
              name="verify"
              render={({ field }) => (
                <FormItem className="mt-6 flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={!form.watch("email")}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I confirm that I have read and understood the information.
                    </FormLabel>
                    <FormDescription>
                      I am responsible for keeping my passkey safe. If I lose
                      it, I will not be able to contribute from this account,
                      and the passkey cannot be recovered.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

                {notice.text}
              </p>

            {isSubmitting ? "Registering…" : "Register"}
        </form>
      </Form>
    </AuthShell>
  );
}
