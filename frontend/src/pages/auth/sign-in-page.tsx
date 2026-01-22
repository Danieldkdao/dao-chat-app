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

const signInSchema = z
  .object({
    email: z.email({ error: "Invalid email " }),
    password: z
      .string({ error: "Invalid password" })
      .min(8, { error: "Password must be at least 8 characters" }),
  })
  .refine((fields) => !fields.password.includes(" "), {
    error: "Password cannot have any whitespace",
    path: ["password"],
  });

type FormType = z.infer<typeof signInSchema>;

export const SignInPage = () => {
  const navigate = useNavigate();
  const [isSocialSignInLoading, setIsSocialSignInLoading] = useState(false);
  const form = useForm<FormType>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loading = form.formState.isSubmitting || isSocialSignInLoading;

  const handleSignIn = async (data: FormType) => {
    await authClient.signIn.email(
      {
        ...data,
        callbackURL: defaultCallbackURL,
      },
      {
        onSuccess: () => {
          form.reset();
          toast.success("Signed in successfully!");
        },
        onError: (error) => {
          toast.error(error.error.message || "Something went wrong");
        },
      },
    );
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    setIsSocialSignInLoading(true);
    await authClient.signIn.social({
      provider,
      callbackURL: defaultCallbackURL,
    });
    setIsSocialSignInLoading(false);
  };

  return (
    <div className="min-h-svh p-6 md:p-10 w-full flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-120 md:max-w-190 m-4">
        <Card className="w-full space-y-4 md:rounded-r-none">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-medium">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-base text-muted-foreground">
              Login to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSignIn)}
                className="space-y-4"
              >
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
                <Button disabled={loading} className="w-full">
                  <LoadingSwap isLoading={loading}>Sign in</LoadingSwap>
                </Button>
              </form>
            </Form>
            <div className="flex items-center gap-2">
              <hr className="text-muted-foreground border border-muted-foreground flex-1" />
              <span>Or Sign in With</span>
              <hr className="text-muted-foreground border border-muted-foreground flex-1" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <Button
                variant="outline"
                className="w-full md:flex-1"
                disabled={loading}
                onClick={() => handleSocialSignIn("google")}
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
                onClick={() => handleSocialSignIn("github")}
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
              Don't have an account?{" "}
              <span
                className="font-medium text-sidebar-ring cursor-pointer"
                onClick={() => navigate("/sign-up")}
              >
                Create an account
              </span>
            </p>
          </CardContent>
        </Card>
        <AuthScreen />
      </div>
    </div>
  );
};
