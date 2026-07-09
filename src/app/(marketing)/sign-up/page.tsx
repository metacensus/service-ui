import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/lib/next-navigation-compat";
import owasp from "owasp-password-strength-test";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

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
    country: z
      .string({
        required_error: "Country is required",
      })
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

export default function SignUp() {
  const router = useRouter();

  const form = useForm<SignUpFormInputs>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      verify: false,
    },
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<SignUpFormInputs> = async (data) => {
    try {
    }
    router.push("/dashboard");
  };

  return (
      <Form {...form}>
              autoComplete="name"
              placeholder="Jane Smith"
              {...form.register("name", { required: true })}
            />

              type="email"
              autoComplete="email"
              placeholder="you@organization.org"
              {...form.register("email", { required: true })}
            />

              {...form.register("country", { required: true })}

              type="password"
              {...form.register("password", { required: true })}
            />

              type="password"
              {...form.register("passwordConfirmation", { required: true })}
            />

            </p>
              Before proceeding, please verify the following:
            </p>
            </ul>

            <FormField
              control={form.control}
              name="verify"
              render={({ field }) => (
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={!form.watch("email")}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                    </FormLabel>
                    <FormDescription>
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

        </form>
      </Form>
  );
}
