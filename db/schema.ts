import { sql } from "drizzle-orm";
import { index, pgPolicy, pgRole, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

// InsForge's built-in role for signed-in requests (already exists in the database).
const authenticated = pgRole("authenticated").existing();

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    // InsForge auth user id (auth.users.id); one row per authenticated user.
    authUserId: uuid("auth_user_id").notNull().unique(),
    name: text("name"),
    email: text("email").notNull().unique(),
    avatarUrl: text("avatar_url"),
    provider: text("provider"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
  },
  () => [
    // Signed-in users can read only their own row through the InsForge API.
    // Server-side writes go through DATABASE_URL and are not affected.
    pgPolicy("users_select_own", {
      for: "select",
      to: authenticated,
      using: sql`auth_user_id = auth.uid()`,
    }),
  ]
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Owner: InsForge auth user id (auth.users.id).
    authUserId: uuid("auth_user_id").notNull(),
    name: text("name").notNull(),
    // Preset icon key (see lib/campaign-icons.ts); null when a custom icon is uploaded.
    icon: text("icon"),
    // Custom icon in the `campaign-icons` storage bucket.
    iconUrl: text("icon_url"),
    iconKey: text("icon_key"),
    // Path under /public, e.g. "/offices/modern-loft.jpg".
    officeImage: text("office_image").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("campaigns_auth_user_id_idx").on(table.authUserId),
    pgPolicy("campaigns_select_own", {
      for: "select",
      to: authenticated,
      using: sql`auth_user_id = auth.uid()`,
    }),
    pgPolicy("campaigns_insert_own", {
      for: "insert",
      to: authenticated,
      withCheck: sql`auth_user_id = auth.uid()`,
    }),
    pgPolicy("campaigns_update_own", {
      for: "update",
      to: authenticated,
      using: sql`auth_user_id = auth.uid()`,
      withCheck: sql`auth_user_id = auth.uid()`,
    }),
    pgPolicy("campaigns_delete_own", {
      for: "delete",
      to: authenticated,
      using: sql`auth_user_id = auth.uid()`,
    }),
  ]
);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: serial("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
