import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  uuid,
  date,
  timestamp,
  boolean,
  index,
  check,
} from "drizzle-orm/pg-core";

/**
 * Better Auth tables — declared here so Drizzle is the single source of
 * truth for the database schema. Better Auth's adapter expects exactly
 * these table/column names.
 */

export const user = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: boolean("emailVerified").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false })
    .notNull()
    .defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey().notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expiresAt", { withTimezone: false }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: false })
    .notNull()
    .defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey().notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  providerId: text("providerId").notNull(),
  accountId: text("accountId").notNull(),
  password: text("password"),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey().notNull(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: false }).notNull(),
});

/**
 * Application pipeline enum and table.
 */

export const applicationStage = pgEnum("application_stage", [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
]);

export type ApplicationStage = (typeof applicationStage.enumValues)[number];

export const applications = pgTable(
  "applications",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    url: text("url"),
    dateApplied: date("dateApplied").notNull(),
    stage: applicationStage("stage").notNull().default("saved"),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("applications_user_idx").on(table.userId),
    userStageIdx: index("applications_user_stage_idx").on(
      table.userId,
      table.stage,
    ),
    userDateIdx: index("applications_user_date_idx").on(
      table.userId,
      table.dateApplied,
    ),
    companyLenCheck: check(
      "applications_company_length_check",
      sql`length(${table.company}) between 1 and 200`,
    ),
    roleLenCheck: check(
      "applications_role_length_check",
      sql`length(${table.role}) between 1 and 200`,
    ),
    urlLenCheck: check(
      "applications_url_length_check",
      sql`${table.url} is null or length(${table.url}) <= 2048`,
    ),
  }),
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
