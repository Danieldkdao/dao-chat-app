import { createAuthClient } from "better-auth/react";

const clientURL =
  import.meta.env.VITE_CLIENT_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

export const defaultCallbackURL = clientURL
  ? new URL("/", clientURL).toString()
  : "/";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
});

export const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const publicRoutes = ["/sign-in", "/sign-up"];
