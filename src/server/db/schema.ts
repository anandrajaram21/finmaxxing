import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  sqliteTable,
  sqliteTableCreator,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { investmentTypes } from "@/lib/investments";

/**
 * Multi-project schema prefix helper
 */
const createTable = sqliteTableCreator((name) => `finmaxxing_${name}`);

// Better Auth core tables
export const user = sqliteTable("user", (d) => ({
  id: d
    .text({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.text({ length: 255 }),
  email: d.text({ length: 255 }).notNull().unique(),
  emailVerified: d.integer({ mode: "boolean" }).default(false),
  image: d.text({ length: 255 }),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}));

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  allocations: many(allocations),
  goals: many(goals),
  investments: many(investments),
  portfolioAssumptions: many(portfolioAssumptions),
  session: many(session),
  transactions: many(transactions),
}));

export const account = sqliteTable(
  "account",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    accountId: d.text({ length: 255 }).notNull(),
    providerId: d.text({ length: 255 }).notNull(),
    accessToken: d.text(),
    refreshToken: d.text(),
    accessTokenExpiresAt: d.integer({ mode: "timestamp" }),
    refreshTokenExpiresAt: d.integer({ mode: "timestamp" }),
    scope: d.text({ length: 255 }),
    idToken: d.text(),
    password: d.text(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const session = sqliteTable(
  "session",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    token: d.text({ length: 255 }).notNull().unique(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    ipAddress: d.text({ length: 255 }),
    userAgent: d.text({ length: 255 }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const verification = sqliteTable(
  "verification",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: d.text({ length: 255 }).notNull(),
    value: d.text({ length: 255 }).notNull(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const portfolioAssumptions = createTable(
  "portfolio_assumption",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    currentYear: d.integer({ mode: "number" }).notNull(),
    inflationRate: d.real().notNull().default(0.06),
    expectedReturnRate: d.real().notNull().default(0.1),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("portfolio_assumption_user_id_idx").on(t.userId),
    check("inflation_rate_non_negative", sql`${t.inflationRate} >= 0`),
    check(
      "expected_return_rate_non_negative",
      sql`${t.expectedReturnRate} >= 0`,
    ),
  ],
);

export const goals = createTable(
  "goal",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: d.text({ length: 255 }).notNull(),
    targetAmountMinor: d.integer({ mode: "number" }).notNull(),
    targetYear: d.integer({ mode: "number" }).notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("goal_user_id_idx").on(t.userId),
    uniqueIndex("goal_user_name_idx").on(t.userId, t.name),
    check("target_amount_minor_positive", sql`${t.targetAmountMinor} > 0`),
    check("target_year_positive", sql`${t.targetYear} > 0`),
  ],
);

export const investments = createTable(
  "investment",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: d.text({ length: 255 }).notNull(),
    tickerSymbol: d.text({ length: 64 }).notNull(),
    investmentType: d
      .text({ length: 32, enum: investmentTypes })
      .notNull()
      .default("stock"),
    isin: d.text({ length: 32 }),
    category: d.text({ length: 128 }),
    monthlySipMinor: d.integer({ mode: "number" }).notNull().default(0),
    currentNav: d.real(),
    navUpdatedAt: d.integer({ mode: "timestamp" }),
    isActive: d.integer({ mode: "boolean" }).notNull().default(true),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("investment_user_id_idx").on(t.userId),
    index("investment_ticker_symbol_idx").on(t.tickerSymbol),
    uniqueIndex("investment_user_ticker_symbol_idx").on(
      t.userId,
      t.tickerSymbol,
    ),
    check("monthly_sip_minor_non_negative", sql`${t.monthlySipMinor} >= 0`),
    check(
      "current_nav_positive",
      sql`${t.currentNav} IS NULL OR ${t.currentNav} > 0`,
    ),
  ],
);

export const allocations = createTable(
  "allocation",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    investmentId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => investments.id, { onDelete: "cascade" }),
    goalId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    percentage: d.real().notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("allocation_user_id_idx").on(t.userId),
    index("allocation_investment_id_idx").on(t.investmentId),
    index("allocation_goal_id_idx").on(t.goalId),
    uniqueIndex("allocation_investment_goal_idx").on(t.investmentId, t.goalId),
    check(
      "allocation_percentage_range",
      sql`${t.percentage} > 0 AND ${t.percentage} <= 1`,
    ),
  ],
);

export const transactions = createTable(
  "transaction",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    investmentId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => investments.id, { onDelete: "cascade" }),
    transactionDate: d.integer({ mode: "timestamp" }).notNull(),
    type: d.text({ enum: ["buy", "sell"] }).notNull(),
    amountMinor: d.integer({ mode: "number" }).notNull(),
    units: d.real().notNull(),
    nav: d.real().notNull(),
    notes: d.text({ length: 1024 }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("transaction_user_id_idx").on(t.userId),
    index("transaction_investment_id_idx").on(t.investmentId),
    index("transaction_date_idx").on(t.transactionDate),
    check("transaction_type_valid", sql`${t.type} IN ('buy', 'sell')`),
    check("transaction_amount_minor_positive", sql`${t.amountMinor} > 0`),
    check("transaction_units_positive", sql`${t.units} > 0`),
    check("transaction_nav_positive", sql`${t.nav} > 0`),
  ],
);

export const portfolioAssumptionsRelations = relations(
  portfolioAssumptions,
  ({ one }) => ({
    user: one(user, {
      fields: [portfolioAssumptions.userId],
      references: [user.id],
    }),
  }),
);

export const goalsRelations = relations(goals, ({ many, one }) => ({
  allocations: many(allocations),
  user: one(user, { fields: [goals.userId], references: [user.id] }),
}));

export const investmentsRelations = relations(investments, ({ many, one }) => ({
  allocations: many(allocations),
  transactions: many(transactions),
  user: one(user, { fields: [investments.userId], references: [user.id] }),
}));

export const allocationsRelations = relations(allocations, ({ one }) => ({
  goal: one(goals, {
    fields: [allocations.goalId],
    references: [goals.id],
  }),
  investment: one(investments, {
    fields: [allocations.investmentId],
    references: [investments.id],
  }),
  user: one(user, { fields: [allocations.userId], references: [user.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  investment: one(investments, {
    fields: [transactions.investmentId],
    references: [investments.id],
  }),
  user: one(user, { fields: [transactions.userId], references: [user.id] }),
}));
