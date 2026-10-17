import "server-only";

import { sql } from "drizzle-orm";
import { db, users } from "@/db";

type AuthUser = {
  id: string;
  email: string;
  providers?: string[];
  profile?: { name?: string; avatar_url?: string } | null;
};

/**
 * Create the app's `users` row on a user's first login, and update
 * `last_login_at` on later logins. Existing name/avatar values are kept.
 *
 * Failures are logged, not thrown, so a database problem never blocks sign-in.
 */
export async function syncUser(authUser: AuthUser, provider = authUser.providers?.[0] ?? "email") {
  const now = new Date();
  try {
    await db
      .insert(users)
      .values({
        authUserId: authUser.id,
        email: authUser.email,
        name: authUser.profile?.name ?? null,
        avatarUrl: authUser.profile?.avatar_url ?? null,
        provider,
        lastLoginAt: now,
      })
      .onConflictDoUpdate({
        target: users.authUserId,
        set: {
          email: authUser.email,
          name: sql`coalesce(${users.name}, excluded.name)`,
          avatarUrl: sql`coalesce(${users.avatarUrl}, excluded.avatar_url)`,
          lastLoginAt: now,
          updatedAt: now,
        },
      });
  } catch (error) {
    console.error("Failed to sync user to database", { authUserId: authUser.id, error });
  }
}
