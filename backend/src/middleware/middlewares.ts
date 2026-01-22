import { type Request, type Response, type NextFunction } from "express";
import { auth } from "../lib/auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../db/db.ts";
import { user } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const headers = fromNodeHeaders(req.headers);
  const data = await auth.api.getSession({ headers });
  if (!data?.user) {
    return res.json({ success: false, message: "Unauthorized" }).status(401);
  }

  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, data.user.id));

  if (!existingUser) {
    return res.json({ success: false, message: "User not found" });
  }

  req.user = data.user;

  next();
};

export const errorHandlingMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  return res
    .json({ success: false, message: err.message, cause: err.cause })
    .status(500);
};
