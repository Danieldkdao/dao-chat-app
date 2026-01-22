import type { User } from "better-auth";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
