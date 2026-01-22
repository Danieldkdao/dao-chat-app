import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaGoogle, FaGithub } from "react-icons/fa6";
import { authClient, defaultCallbackURL } from "@/lib/auth-client";
import { toast } from "sonner";
import { useState } from "react";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { AuthScreen } from "@/components/auth/auth-screen";
import { useNavigate } from "react-router";

const signUpSchema = z
  .object({
    name: z
      .string({ error: "Invalid name" })
      .trim()
      .min(1, { error: "Name is required" }),
    email: z.email({ error: "Invalid email " }),
    password: z
      .string({ error: "Invalid password" })
      .min(8, { error: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string({ error: "Invalid password" })
      .min(8, { error: "Password must be at least 8 characters" }),
  })
  .refine((fields) => !fields.password.includes(" "), {
    error: "Password cannot have any whitespace",
    path: ["password"],
  })
  .refine((fields) => fields.password === fields.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormType = z.infer<typeof signUpSchema>;

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [isSocialSignUpLoading, setIsSocialSignUpLoading] = useState(false);
  const form = useForm<FormType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loading = form.formState.isSubmitting || isSocialSignUpLoading;

  const handleSignUp = async (data: FormType) => {
    await authClient.signUp.email(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: defaultCallbackURL,
      },
      {
        onSuccess: () => {
          form.reset();
          toast.success("Account created successfully!");
        },
        onError: (error) => {
          toast.error(error.error.message || "Something went wrong");
        },
      },
    );
  };

  const handleSocialSignUp = async (provider: "google" | "github") => {
    setIsSocialSignUpLoading(true);
    await authClient.signIn.social({
      provider,
      callbackURL: defaultCallbackURL,
    });
    setIsSocialSignUpLoading(false);
  };

  return (
    <div className="w-full min-h-svh p-6 md:p-10 flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-120 md:max-w-190">
        <Card className="w-full space-y-4 md:rounded-r-none">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-medium">
              Sign Up
            </CardTitle>
            <CardDescription className="text-center text-base text-muted-foreground">
              Create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSignUp)}
                className="space-y-4"
              >
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="example@test.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="••••••••••"
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="confirmPassword"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="••••••••••"
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button disabled={loading} className="w-full">
                  <LoadingSwap isLoading={loading}>Sign up</LoadingSwap>
                </Button>
              </form>
            </Form>
            <div className="flex items-center gap-2">
              <hr className="text-muted-foreground border border-muted-foreground flex-1" />
              <span>Or Sign up With</span>
              <hr className="text-muted-foreground border border-muted-foreground flex-1" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <Button
                variant="outline"
                className="w-full md:flex-1"
                disabled={loading}
                onClick={() => handleSocialSignUp("google")}
              >
                <LoadingSwap isLoading={loading}>
                  <div className="flex items-center gap-2">
                    <FaGoogle />
                    <span>Google</span>
                  </div>
                </LoadingSwap>
              </Button>
              <Button
                variant="outline"
                className="w-full md:flex-1 flex items-center gap-2"
                disabled={loading}
                onClick={() => handleSocialSignUp("github")}
              >
                <LoadingSwap isLoading={loading}>
                  <div className="flex items-center gap-2">
                    <FaGithub />
                    <span>Github</span>
                  </div>
                </LoadingSwap>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <span
                className="font-medium text-sidebar-ring cursor-pointer"
                onClick={() => navigate("/sign-in")}
              >
                Sign in here
              </span>
            </p>
          </CardContent>
        </Card>
        <AuthScreen />
      </div>
    </div>
  );
};
