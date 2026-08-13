import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const host = opts.req.hostname;
  const isLocalDev =
    process.env.NODE_ENV !== "production" &&
    (host === "localhost" || host === "127.0.0.1" || host === "::1");

  if (!user && isLocalDev) {
    user = {
      id: 1,
      openId: "local-admin",
      name: "Rafael",
      email: "admin@churraspao.local",
      phone: null,
      loginMethod: "local",
      role: "admin",
      loyaltyPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
