var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/replit_integrations/chat/routes.ts
import OpenAI from "openai";

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  articleBookmarks: () => articleBookmarks,
  articleBookmarksRelations: () => articleBookmarksRelations,
  articleCategoryEnum: () => articleCategoryEnum,
  articles: () => articles,
  articlesRelations: () => articlesRelations,
  authProviderEnum: () => authProviderEnum,
  directMessages: () => directMessages,
  directMessagesRelations: () => directMessagesRelations,
  dmConversations: () => dmConversations,
  dmConversationsRelations: () => dmConversationsRelations,
  investmentCategoryEnum: () => investmentCategoryEnum,
  investmentDocuments: () => investmentDocuments,
  investmentDocumentsRelations: () => investmentDocumentsRelations,
  investmentMilestones: () => investmentMilestones,
  investmentMilestonesRelations: () => investmentMilestonesRelations,
  investmentStatusEnum: () => investmentStatusEnum,
  investmentTeamMembers: () => investmentTeamMembers,
  investmentTeamMembersRelations: () => investmentTeamMembersRelations,
  investments: () => investments,
  investmentsRelations: () => investmentsRelations,
  notificationPreferences: () => notificationPreferences,
  notificationTypeEnum: () => notificationTypeEnum,
  notifications: () => notifications,
  passwordResetTokens: () => passwordResetTokens,
  paymentMethodTypeEnum: () => paymentMethodTypeEnum,
  paymentMethods: () => paymentMethods,
  portfolioInvestments: () => portfolioInvestments,
  portfolioInvestmentsRelations: () => portfolioInvestmentsRelations,
  portfolioStatusEnum: () => portfolioStatusEnum,
  pushTokens: () => pushTokens,
  riskLevelEnum: () => riskLevelEnum,
  transactionStatusEnum: () => transactionStatusEnum,
  transactionTypeEnum: () => transactionTypeEnum,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  userSessions: () => userSessions,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
var authProviderEnum = pgEnum("auth_provider", ["apple", "google", "email", "demo", "github", "facebook"]);
var investmentCategoryEnum = pgEnum("investment_category", [
  "Biotech",
  "Medical Devices",
  "Digital Health",
  "Pharmaceuticals",
  "Research",
  "Healthcare Services"
]);
var riskLevelEnum = pgEnum("risk_level", ["Low", "Medium", "High"]);
var investmentStatusEnum = pgEnum("investment_status", [
  "active",
  "funded",
  "closed",
  "cancelled"
]);
var portfolioStatusEnum = pgEnum("portfolio_status", [
  "active",
  "completed",
  "pending",
  "cancelled"
]);
var transactionTypeEnum = pgEnum("transaction_type", [
  "investment",
  "dividend",
  "withdrawal",
  "refund"
]);
var transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed"
]);
var articleCategoryEnum = pgEnum("article_category", [
  "AI & Healthcare",
  "Biotech",
  "Medical Devices",
  "Digital Health",
  "Market Trends",
  "Regulations",
  "Research"
]);
var paymentMethodTypeEnum = pgEnum("payment_method_type", ["bank", "card"]);
var notificationTypeEnum = pgEnum("notification_type", [
  "investment_update",
  "portfolio_milestone",
  "new_opportunity",
  "article",
  "system"
]);
var users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    avatarUrl: text("avatar_url"),
    provider: authProviderEnum("provider").notNull().default("email"),
    providerUserId: varchar("provider_user_id", { length: 255 }),
    passwordHash: text("password_hash"),
    isVerified: boolean("is_verified").notNull().default(false),
    isAccredited: boolean("is_accredited").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at"),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    providerIdx: index("users_provider_idx").on(table.provider, table.providerUserId)
  })
);
var userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token)
  })
);
var passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    tokenIdx: uniqueIndex("password_reset_token_idx").on(table.token),
    userIdIdx: index("password_reset_user_id_idx").on(table.userId)
  })
);
var pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    platform: varchar("platform", { length: 10 }),
    // ios, android
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    userIdIdx: index("push_tokens_user_id_idx").on(table.userId),
    tokenIdx: uniqueIndex("push_tokens_token_idx").on(table.token)
  })
);
var notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  investmentUpdates: boolean("investment_updates").notNull().default(true),
  newOpportunities: boolean("new_opportunities").notNull().default(true),
  portfolioMilestones: boolean("portfolio_milestones").notNull().default(true),
  articles: boolean("articles").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var investments = pgTable(
  "investments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    longDescription: text("long_description"),
    category: investmentCategoryEnum("category").notNull(),
    fundingGoal: decimal("funding_goal", { precision: 15, scale: 2 }).notNull(),
    fundingCurrent: decimal("funding_current", { precision: 15, scale: 2 }).notNull().default("0"),
    minimumInvestment: decimal("minimum_investment", { precision: 15, scale: 2 }).notNull().default("1000"),
    expectedRoiMin: decimal("expected_roi_min", { precision: 5, scale: 2 }),
    expectedRoiMax: decimal("expected_roi_max", { precision: 5, scale: 2 }),
    riskLevel: riskLevelEnum("risk_level").notNull().default("Medium"),
    status: investmentStatusEnum("status").notNull().default("active"),
    imageUrl: text("image_url"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    investorCount: integer("investor_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    statusIdx: index("investments_status_idx").on(table.status),
    categoryIdx: index("investments_category_idx").on(table.category),
    endDateIdx: index("investments_end_date_idx").on(table.endDate)
  })
);
var investmentDocuments = pgTable(
  "investment_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    investmentId: uuid("investment_id").notNull().references(() => investments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    // pdf, xlsx, etc.
    url: text("url").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    investmentIdIdx: index("inv_docs_investment_id_idx").on(table.investmentId)
  })
);
var investmentTeamMembers = pgTable(
  "investment_team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    investmentId: uuid("investment_id").notNull().references(() => investments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    role: varchar("role", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    linkedInUrl: text("linkedin_url"),
    sortOrder: integer("sort_order").notNull().default(0)
  },
  (table) => ({
    investmentIdIdx: index("inv_team_investment_id_idx").on(table.investmentId)
  })
);
var investmentMilestones = pgTable(
  "investment_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    investmentId: uuid("investment_id").notNull().references(() => investments.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    targetDate: timestamp("target_date"),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    sortOrder: integer("sort_order").notNull().default(0)
  },
  (table) => ({
    investmentIdIdx: index("inv_milestones_investment_id_idx").on(table.investmentId)
  })
);
var portfolioInvestments = pgTable(
  "portfolio_investments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    investmentId: uuid("investment_id").notNull().references(() => investments.id, { onDelete: "restrict" }),
    amountInvested: decimal("amount_invested", { precision: 15, scale: 2 }).notNull(),
    currentValue: decimal("current_value", { precision: 15, scale: 2 }).notNull(),
    shares: decimal("shares", { precision: 15, scale: 6 }),
    status: portfolioStatusEnum("status").notNull().default("pending"),
    investedAt: timestamp("invested_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    userIdIdx: index("portfolio_user_id_idx").on(table.userId),
    investmentIdIdx: index("portfolio_investment_id_idx").on(table.investmentId),
    userInvestmentIdx: uniqueIndex("portfolio_user_investment_idx").on(
      table.userId,
      table.investmentId
    )
  })
);
var transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    portfolioInvestmentId: uuid("portfolio_investment_id").references(
      () => portfolioInvestments.id,
      { onDelete: "set null" }
    ),
    type: transactionTypeEnum("type").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    status: transactionStatusEnum("status").notNull().default("pending"),
    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
    reference: varchar("reference", { length: 255 }),
    metadata: text("metadata"),
    // JSON string for additional data
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at")
  },
  (table) => ({
    userIdIdx: index("transactions_user_id_idx").on(table.userId),
    statusIdx: index("transactions_status_idx").on(table.status),
    createdAtIdx: index("transactions_created_at_idx").on(table.createdAt)
  })
);
var paymentMethods = pgTable(
  "payment_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: paymentMethodTypeEnum("type").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    last4: varchar("last4", { length: 4 }).notNull(),
    expiryMonth: integer("expiry_month"),
    expiryYear: integer("expiry_year"),
    bankName: varchar("bank_name", { length: 255 }),
    isDefault: boolean("is_default").notNull().default(false),
    stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    userIdIdx: index("payment_methods_user_id_idx").on(table.userId)
  })
);
var articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    summary: text("summary").notNull(),
    content: text("content"),
    source: varchar("source", { length: 255 }).notNull(),
    sourceUrl: text("source_url"),
    author: varchar("author", { length: 255 }),
    imageUrl: text("image_url"),
    category: articleCategoryEnum("category").notNull(),
    tags: text("tags"),
    // JSON array as string
    readTime: integer("read_time").notNull().default(5),
    isFeatured: boolean("is_featured").notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    publishedAt: timestamp("published_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    categoryIdx: index("articles_category_idx").on(table.category),
    publishedAtIdx: index("articles_published_at_idx").on(table.publishedAt),
    featuredIdx: index("articles_featured_idx").on(table.isFeatured)
  })
);
var articleBookmarks = pgTable(
  "article_bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    userIdIdx: index("bookmarks_user_id_idx").on(table.userId),
    userArticleIdx: uniqueIndex("bookmarks_user_article_idx").on(
      table.userId,
      table.articleId
    )
  })
);
var notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    data: text("data"),
    // JSON string
    read: boolean("read").notNull().default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    readIdx: index("notifications_read_idx").on(table.userId, table.read)
  })
);
var dmConversations = pgTable(
  "dm_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user1Id: uuid("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    user2Id: uuid("user2_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at"),
    lastMessage: text("last_message"),
    user1Unread: integer("user1_unread").notNull().default(0),
    user2Unread: integer("user2_unread").notNull().default(0),
    user1Muted: boolean("user1_muted").notNull().default(false),
    user2Muted: boolean("user2_muted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (table) => ({
    user1Idx: index("dm_conv_user1_idx").on(table.user1Id),
    user2Idx: index("dm_conv_user2_idx").on(table.user2Id),
    usersIdx: uniqueIndex("dm_conv_users_idx").on(table.user1Id, table.user2Id)
  })
);
var directMessages = pgTable(
  "direct_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id").notNull().references(() => dmConversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    conversationIdx: index("dm_conversation_idx").on(table.conversationId),
    senderIdx: index("dm_sender_idx").on(table.senderId),
    createdAtIdx: index("dm_created_at_idx").on(table.createdAt)
  })
);
var usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(userSessions),
  pushTokens: many(pushTokens),
  notificationPreferences: one(notificationPreferences),
  portfolioInvestments: many(portfolioInvestments),
  transactions: many(transactions),
  paymentMethods: many(paymentMethods),
  bookmarks: many(articleBookmarks),
  notifications: many(notifications),
  dmConversationsAsUser1: many(dmConversations, { relationName: "user1" }),
  dmConversationsAsUser2: many(dmConversations, { relationName: "user2" }),
  sentMessages: many(directMessages)
}));
var dmConversationsRelations = relations(dmConversations, ({ one, many }) => ({
  user1: one(users, {
    fields: [dmConversations.user1Id],
    references: [users.id],
    relationName: "user1"
  }),
  user2: one(users, {
    fields: [dmConversations.user2Id],
    references: [users.id],
    relationName: "user2"
  }),
  messages: many(directMessages)
}));
var directMessagesRelations = relations(directMessages, ({ one }) => ({
  conversation: one(dmConversations, {
    fields: [directMessages.conversationId],
    references: [dmConversations.id]
  }),
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id]
  })
}));
var investmentsRelations = relations(investments, ({ many }) => ({
  documents: many(investmentDocuments),
  teamMembers: many(investmentTeamMembers),
  milestones: many(investmentMilestones),
  portfolioInvestments: many(portfolioInvestments)
}));
var investmentDocumentsRelations = relations(investmentDocuments, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentDocuments.investmentId],
    references: [investments.id]
  })
}));
var investmentTeamMembersRelations = relations(investmentTeamMembers, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentTeamMembers.investmentId],
    references: [investments.id]
  })
}));
var investmentMilestonesRelations = relations(investmentMilestones, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentMilestones.investmentId],
    references: [investments.id]
  })
}));
var portfolioInvestmentsRelations = relations(portfolioInvestments, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolioInvestments.userId],
    references: [users.id]
  }),
  investment: one(investments, {
    fields: [portfolioInvestments.investmentId],
    references: [investments.id]
  }),
  transactions: many(transactions)
}));
var transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  }),
  portfolioInvestment: one(portfolioInvestments, {
    fields: [transactions.portfolioInvestmentId],
    references: [portfolioInvestments.id]
  }),
  paymentMethod: one(paymentMethods, {
    fields: [transactions.paymentMethodId],
    references: [paymentMethods.id]
  })
}));
var articlesRelations = relations(articles, ({ many }) => ({
  bookmarks: many(articleBookmarks)
}));
var articleBookmarksRelations = relations(articleBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [articleBookmarks.userId],
    references: [users.id]
  }),
  article: one(articles, {
    fields: [articleBookmarks.articleId],
    references: [articles.id]
  })
}));

// server/db.ts
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable as pgTable2, text as text2, varchar as varchar2, serial, integer as integer2, timestamp as timestamp2 } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users2 = pgTable2("users", {
  id: varchar2("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text2("username").notNull().unique(),
  password: text2("password").notNull()
});
var insertUserSchema = createInsertSchema(users2).pick({
  username: true,
  password: true
});
var conversations = pgTable2("conversations", {
  id: serial("id").primaryKey(),
  title: text2("title").notNull(),
  createdAt: timestamp2("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var messages = pgTable2("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer2("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text2("role").notNull(),
  content: text2("content").notNull(),
  createdAt: timestamp2("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});

// server/replit_integrations/chat/storage.ts
import { eq, desc } from "drizzle-orm";
var chatStorage = {
  async getConversation(id) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  },
  async getAllConversations() {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  },
  async createConversation(title) {
    const [conversation] = await db.insert(conversations).values({ title }).returning();
    return conversation;
  },
  async deleteConversation(id) {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  },
  async getMessagesByConversation(conversationId) {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  },
  async createMessage(conversationId, role, content) {
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  }
};

// server/replit_integrations/chat/routes.ts
var openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});
function registerChatRoutes(app2) {
  app2.get("/api/conversations", async (req, res) => {
    try {
      const conversations2 = await chatStorage.getAllConversations();
      res.json(conversations2);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  app2.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages2 = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages: messages2 });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });
  app2.post("/api/conversations", async (req, res) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });
  app2.delete("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });
  app2.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      await chatStorage.createMessage(conversationId, "user", content);
      const messages2 = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages2.map((m) => ({
        role: m.role,
        content: m.content
      }));
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048
      });
      let fullResponse = "";
      for await (const chunk of stream) {
        const content2 = chunk.choices[0]?.delta?.content || "";
        if (content2) {
          fullResponse += content2;
          res.write(`data: ${JSON.stringify({ content: content2 })}

`);
        }
      }
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);
      res.write(`data: ${JSON.stringify({ done: true })}

`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}

`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

// server/routes/auth.ts
import { Router } from "express";
import { eq as eq3, and as and2, gt as gt2, isNull } from "drizzle-orm";

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
import { eq as eq2, and, gt } from "drizzle-orm";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
function generateToken(userId, sessionId) {
  return jwt.sign(
    { userId, sessionId },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    const [session] = await db.select().from(userSessions).where(
      and(
        eq2(userSessions.id, decoded.sessionId),
        eq2(userSessions.userId, decoded.userId),
        gt(userSessions.expiresAt, /* @__PURE__ */ new Date())
      )
    ).limit(1);
    if (!session) {
      res.status(401).json({ message: "Session expired" });
      return;
    }
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isVerified: users.isVerified,
      isAccredited: users.isAccredited
    }).from(users).where(eq2(users.id, decoded.userId)).limit(1);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      next();
      return;
    }
    const [session] = await db.select().from(userSessions).where(
      and(
        eq2(userSessions.id, decoded.sessionId),
        eq2(userSessions.userId, decoded.userId),
        gt(userSessions.expiresAt, /* @__PURE__ */ new Date())
      )
    ).limit(1);
    if (!session) {
      next();
      return;
    }
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isVerified: users.isVerified,
      isAccredited: users.isAccredited
    }).from(users).where(eq2(users.id, decoded.userId)).limit(1);
    if (user) {
      req.user = user;
      req.token = token;
    }
    next();
  } catch (error) {
    next();
  }
}

// server/services/socialAuth.ts
import jwt2 from "jsonwebtoken";
import jwksClient from "jwks-rsa";
async function verifyFacebookToken(accessToken) {
  try {
    const userResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture.type(large)&access_token=${accessToken}`
    );
    if (!userResponse.ok) {
      console.error("Facebook user fetch failed:", userResponse.status);
      return null;
    }
    const userData = await userResponse.json();
    return {
      sub: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture?.data?.url,
      first_name: userData.first_name,
      last_name: userData.last_name
    };
  } catch (error) {
    console.error("Facebook token verification failed:", error);
    return null;
  }
}
async function verifyGithubToken(accessToken) {
  try {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (!userResponse.ok) {
      console.error("GitHub user fetch failed:", userResponse.status);
      return null;
    }
    const userData = await userResponse.json();
    let email = userData.email;
    if (!email) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(
          (e) => e.primary && e.verified
        );
        email = primaryEmail?.email;
      }
    }
    return {
      sub: String(userData.id),
      email,
      name: userData.name,
      picture: userData.avatar_url,
      login: userData.login
    };
  } catch (error) {
    console.error("GitHub token verification failed:", error);
    return null;
  }
}
var appleJwksClient = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
  cache: true,
  cacheMaxAge: 864e5
  // 1 day
});
async function verifyAppleToken(identityToken) {
  try {
    const decodedHeader = jwt2.decode(identityToken, { complete: true });
    if (!decodedHeader || typeof decodedHeader === "string") {
      return null;
    }
    const kid = decodedHeader.header.kid;
    const signingKey = await appleJwksClient.getSigningKey(kid);
    const publicKey = signingKey.getPublicKey();
    const audiences = [
      process.env.APPLE_CLIENT_ID,
      "com.medinvest.app",
      "host.exp.Exponent"
    ].filter(Boolean);
    const payload = jwt2.verify(identityToken, publicKey, {
      algorithms: ["RS256"],
      issuer: "https://appleid.apple.com"
    });
    if (!audiences.includes(payload.aud)) {
      console.error("Apple token audience mismatch. Got:", payload.aud, "Expected one of:", audiences);
      return null;
    }
    return payload;
  } catch (error) {
    console.error("Apple token verification failed:", error);
    return null;
  }
}
async function verifyGoogleToken(accessToken) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    if (!response.ok) {
      console.error("Google token verification failed:", response.status);
      return null;
    }
    const userInfo = await response.json();
    return {
      iss: "https://accounts.google.com",
      azp: "",
      aud: "",
      sub: userInfo.sub,
      email: userInfo.email,
      email_verified: userInfo.email_verified,
      name: userInfo.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      locale: userInfo.locale,
      iat: Math.floor(Date.now() / 1e3),
      exp: Math.floor(Date.now() / 1e3) + 3600
    };
  } catch (error) {
    console.error("Google token verification failed:", error);
    return null;
  }
}

// server/routes/auth.ts
import bcrypt from "bcrypt";
import crypto from "crypto";
function cleanEnv(key) {
  const val = process.env[key];
  if (!val) return void 0;
  let cleaned = val.trim();
  cleaned = cleaned.replace(/[\r\n]+.*$/s, "");
  cleaned = cleaned.replace(/\\n.*$/s, "");
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, "");
  return cleaned || void 0;
}
function getGoogleClientId() {
  return cleanEnv("GOOGLE_WEB_CLIENT_ID") || cleanEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");
}
function getGoogleClientSecret() {
  return cleanEnv("GOOGLE_WEB_CLIENT_SECRET");
}
function getGithubClientId(mobile = false) {
  if (mobile) {
    return cleanEnv("GITHUB_MOBILE_CLIENT_ID") || cleanEnv("EXPO_PUBLIC_GITHUB_MOBILE_CLIENT_ID");
  }
  return cleanEnv("GITHUB_CLIENT_ID") || cleanEnv("EXPO_PUBLIC_GITHUB_CLIENT_ID");
}
function getGithubClientSecret(mobile = false) {
  return mobile ? cleanEnv("GITHUB_MOBILE_CLIENT_SECRET") : cleanEnv("GITHUB_CLIENT_SECRET");
}
function getFacebookAppId() {
  return cleanEnv("FACEBOOK_APP_ID") || cleanEnv("EXPO_PUBLIC_FACEBOOK_APP_ID");
}
function getFacebookAppSecret() {
  return cleanEnv("FACEBOOK_APP_SECRET");
}
var OAUTH_REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE || "https://themedicineandmoneyshow.com";
var router = Router();
var STATE_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
function createSignedOAuthState(provider, flow, appRedirectUri) {
  const payload = { p: provider, f: flow, n: crypto.randomBytes(16).toString("hex") };
  if (appRedirectUri) {
    payload.r = appRedirectUri;
  }
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", STATE_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}
function verifySignedOAuthState(state) {
  try {
    const dotIdx = state.indexOf(".");
    if (dotIdx === -1) return null;
    const data = state.substring(0, dotIdx);
    const sig = state.substring(dotIdx + 1);
    const expectedSig = crypto.createHmac("sha256", STATE_SECRET).update(data).digest("base64url");
    if (sig !== expectedSig) {
      console.error("[OAuth] Invalid state signature");
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    return { provider: payload.p, flow: payload.f || "landing", appRedirectUri: payload.r };
  } catch (err) {
    console.error("[OAuth] Failed to decode state:", err);
    return null;
  }
}
router.post("/register", async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    if (!first_name || !last_name) {
      res.status(400).json({ message: "First and last name are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters" });
      return;
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      res.status(400).json({
        message: "Password must contain uppercase, lowercase, and number"
      });
      return;
    }
    const [existingUser] = await db.select().from(users).where(eq3(users.email, email.toLowerCase())).limit(1);
    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }
    const SALT_ROUNDS = 10;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName: first_name,
      lastName: last_name,
      provider: "email",
      isVerified: false,
      lastLoginAt: /* @__PURE__ */ new Date()
    }).returning();
    await db.insert(notificationPreferences).values({
      userId: newUser.id
    });
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const [session] = await db.insert(userSessions).values({
      userId: newUser.id,
      token: crypto.randomUUID(),
      expiresAt
    }).returning();
    const jwtToken = generateToken(newUser.id, session.id);
    res.status(201).json({
      token: jwtToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isVerified: newUser.isVerified,
        fullName: [newUser.firstName, newUser.lastName].filter(Boolean).join(" ")
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    const [user] = await db.select().from(users).where(eq3(users.email, email.toLowerCase())).limit(1);
    if (!user || !user.passwordHash) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    await db.update(users).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, user.id));
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const [session] = await db.insert(userSessions).values({
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt
    }).returning();
    const jwtToken = generateToken(user.id, session.id);
    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        fullName: [user.firstName, user.lastName].filter(Boolean).join(" ")
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});
router.post("/google/token", async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    if (!code) {
      res.status(400).json({ message: "Authorization code is required" });
      return;
    }
    const clientId = getGoogleClientId();
    const clientSecret = getGoogleClientSecret();
    if (!clientId || !clientSecret) {
      res.status(500).json({ message: "Google OAuth is not configured" });
      return;
    }
    console.log("Google token exchange: redirect_uri =", redirect_uri);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${OAUTH_REDIRECT_BASE}/api/auth/google/callback`,
        grant_type: "authorization_code"
      }).toString()
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error("Google token exchange error:", tokenData);
      res.status(401).json({ message: tokenData.error_description || "Failed to exchange code" });
      return;
    }
    res.json({ access_token: tokenData.access_token });
  } catch (error) {
    console.error("Google token exchange error:", error);
    res.status(500).json({ message: "Token exchange failed" });
  }
});
router.post("/github/token", async (req, res) => {
  try {
    const { code, redirect_uri, platform } = req.body;
    if (!code) {
      res.status(400).json({ message: "Authorization code is required" });
      return;
    }
    const isMobile = platform === "mobile" || platform === "ios" || platform === "android";
    let clientId = getGithubClientId(isMobile);
    let clientSecret = getGithubClientSecret(isMobile);
    if (isMobile && (!clientId || !clientSecret)) {
      console.log("Mobile GitHub credentials not found, falling back to web credentials");
      clientId = getGithubClientId(false);
      clientSecret = getGithubClientSecret(false);
    }
    if (!clientId || !clientSecret) {
      res.status(500).json({ message: "GitHub OAuth is not configured" });
      return;
    }
    console.log(`GitHub token exchange: platform=${platform}, isMobile=${isMobile}`);
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${OAUTH_REDIRECT_BASE}/api/auth/github/callback`
      })
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error("GitHub token exchange error:", tokenData);
      res.status(401).json({ message: tokenData.error_description || "Failed to exchange code" });
      return;
    }
    res.json({ access_token: tokenData.access_token });
  } catch (error) {
    console.error("GitHub token exchange error:", error);
    res.status(500).json({ message: "Token exchange failed" });
  }
});
router.post("/facebook/token", async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    if (!code) {
      res.status(400).json({ message: "Authorization code is required" });
      return;
    }
    const appId = getFacebookAppId();
    const appSecret = getFacebookAppSecret();
    if (!appId || !appSecret) {
      res.status(500).json({ message: "Facebook OAuth is not configured" });
      return;
    }
    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.append("client_id", appId);
    tokenUrl.searchParams.append("client_secret", appSecret);
    tokenUrl.searchParams.append("redirect_uri", `${OAUTH_REDIRECT_BASE}/api/auth/facebook/callback`);
    tokenUrl.searchParams.append("code", code);
    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error("Facebook token exchange error:", tokenData);
      res.status(401).json({ message: tokenData.error.message || "Failed to exchange code" });
      return;
    }
    res.json({ access_token: tokenData.access_token });
  } catch (error) {
    console.error("Facebook token exchange error:", error);
    res.status(500).json({ message: "Token exchange failed" });
  }
});
function getBaseUri() {
  const oauthDomain = process.env.OAUTH_CALLBACK_DOMAIN;
  if (oauthDomain) {
    return `https://${oauthDomain}`;
  }
  const publishedDomain = process.env.EXPO_PUBLIC_DOMAIN?.replace(/:5000$/, "");
  if (publishedDomain && !publishedDomain.includes("localhost")) {
    return `https://${publishedDomain}`;
  }
  return "http://localhost:5000";
}
function getCallbackUri(_provider) {
  const base = getBaseUri();
  return `${base}/api/auth/callback`;
}
router.get("/google/start", (req, res) => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    res.status(500).json({ message: "Google OAuth is not configured" });
    return;
  }
  const callbackUri = getCallbackUri("google");
  const flow = req.query.flow || "landing";
  const appRedirectUri = req.query.app_redirect_uri;
  const state = createSignedOAuthState("google", flow, appRedirectUri);
  console.log(`[OAuth Start] Google - redirect_uri: ${callbackUri}, flow: ${flow}`);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUri,
    response_type: "code",
    scope: "openid profile email",
    state,
    access_type: "offline",
    prompt: "select_account"
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});
router.get("/github/start", (req, res) => {
  const clientId = getGithubClientId() || getGithubClientId(true);
  if (!clientId) {
    res.status(500).json({ message: "GitHub OAuth is not configured" });
    return;
  }
  const callbackUri = getCallbackUri("github");
  const flow = req.query.flow || "landing";
  const appRedirectUri = req.query.app_redirect_uri;
  const state = createSignedOAuthState("github", flow, appRedirectUri);
  console.log(`[OAuth Start] GitHub - redirect_uri: ${callbackUri}, flow: ${flow}`);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUri,
    scope: "user:email read:user",
    state
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});
router.get("/facebook/start", (req, res) => {
  const appId = getFacebookAppId();
  if (!appId) {
    res.status(500).json({ message: "Facebook OAuth is not configured" });
    return;
  }
  const callbackUri = getCallbackUri("facebook");
  const flow = req.query.flow || "landing";
  const appRedirectUri = req.query.app_redirect_uri;
  const state = createSignedOAuthState("facebook", flow, appRedirectUri);
  console.log(`[OAuth Start] Facebook - redirect_uri: ${callbackUri}, flow: ${flow}`);
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: callbackUri,
    scope: "email,public_profile",
    state,
    response_type: "code"
  });
  res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`);
});
router.get("/mobile-callback", (req, res) => {
  const token = req.query.token;
  const error = req.query.error;
  if (token) {
    res.send("<html><body><p>Authentication successful. You can close this window.</p></body></html>");
  } else if (error) {
    res.send(`<html><body><p>Authentication failed: ${error}</p></body></html>`);
  } else {
    res.send("<html><body><p>Authentication in progress...</p></body></html>");
  }
});
router.get("/callback", async (req, res) => {
  try {
    const { code, state, error: oauthError, error_description } = req.query;
    const stateStr = typeof state === "string" ? state : "";
    const stateData = stateStr ? verifySignedOAuthState(stateStr) : null;
    const sendError = (msg, statusCode = 400) => {
      if (stateData?.flow === "popup") {
        return res.status(statusCode).send(getPopupErrorPage(msg));
      }
      if (stateData?.appRedirectUri) {
        const appUri = stateData.appRedirectUri;
        const separator = appUri.includes("?") ? "&" : "?";
        const errorRedirect = `${appUri}${separator}error=${encodeURIComponent(msg)}`;
        if (appUri.startsWith("http")) {
          return res.redirect(errorRedirect);
        }
        return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.location.href=${JSON.stringify(errorRedirect)};</script></body></html>`);
      }
      return res.status(statusCode).send(getOAuthResultPage("error", msg));
    };
    if (oauthError) {
      console.error("[OAuth Callback] Error from provider:", oauthError, error_description);
      return sendError(`Authentication failed: ${error_description || oauthError}`);
    }
    if (!code || !state || typeof code !== "string" || typeof state !== "string") {
      return sendError("Missing authorization code or state");
    }
    if (!stateData) {
      console.error("[OAuth Callback] Invalid or tampered state parameter");
      return res.status(400).send(getOAuthResultPage("error", "Invalid state parameter. Please try again."));
    }
    const provider = stateData.provider;
    if (!["google", "github", "facebook"].includes(provider)) {
      return sendError("Unknown provider");
    }
    console.log(`[OAuth Callback] Provider: ${provider}, code length: ${code.length}, has appRedirectUri: ${!!stateData.appRedirectUri}`);
    const callbackUri = getCallbackUri(provider);
    console.log(`[OAuth Callback] Using redirect_uri for token exchange: ${callbackUri}`);
    let accessToken;
    if (provider === "github") {
      const clientId = getGithubClientId() || getGithubClientId(true);
      const clientSecret = getGithubClientSecret() || getGithubClientSecret(true);
      if (!clientId || !clientSecret) {
        console.error("[OAuth Callback] GitHub missing config - clientId:", !!clientId, "clientSecret:", !!clientSecret);
        return sendError("GitHub OAuth is not configured", 500);
      }
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: callbackUri })
      });
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        console.error("[OAuth Callback] GitHub token error:", tokenData);
        return sendError(tokenData.error_description || "GitHub token exchange failed", 401);
      }
      accessToken = tokenData.access_token;
    } else if (provider === "google") {
      const clientId = getGoogleClientId();
      const clientSecret = getGoogleClientSecret();
      if (!clientId || !clientSecret) {
        console.error(`[OAuth Callback] Google OAuth missing config - clientId: ${!!clientId}, clientSecret: ${!!clientSecret}`);
        return sendError("Google OAuth is not configured", 500);
      }
      console.log(`[OAuth Callback] Google token exchange - redirect_uri: "${callbackUri}", code length: ${code.length}`);
      const tokenBody = new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUri, grant_type: "authorization_code" });
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString()
      });
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        console.error("[OAuth Callback] Google token error:", JSON.stringify(tokenData));
        return sendError(`Google login failed: ${tokenData.error} - ${tokenData.error_description || "unknown"}`, 401);
      }
      accessToken = tokenData.access_token;
    } else if (provider === "facebook") {
      const appId = getFacebookAppId();
      const appSecret = getFacebookAppSecret();
      if (!appId || !appSecret) {
        return sendError("Facebook OAuth is not configured", 500);
      }
      console.log(`[OAuth Callback] Facebook token exchange - redirect_uri: "${callbackUri}", code length: ${code.length}`);
      const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
      tokenUrl.searchParams.append("client_id", appId);
      tokenUrl.searchParams.append("client_secret", appSecret);
      tokenUrl.searchParams.append("code", code);
      tokenUrl.searchParams.append("redirect_uri", callbackUri);
      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        console.error("[OAuth Callback] Facebook token error:", JSON.stringify(tokenData));
        const fbErrMsg = tokenData.error?.message || "Facebook token exchange failed";
        if (fbErrMsg.includes("domain") && fbErrMsg.includes("app's domains")) {
          return sendError("Facebook login configuration error. The callback domain needs to be added to the Facebook app settings.", 401);
        }
        return sendError(fbErrMsg, 401);
      }
      accessToken = tokenData.access_token;
    }
    if (!accessToken) {
      return sendError("Failed to obtain access token", 401);
    }
    let verifiedEmail;
    let providerUserId;
    let verifiedFirstName;
    let verifiedLastName;
    let verifiedAvatarUrl;
    if (provider === "google") {
      const googleData = await verifyGoogleToken(accessToken);
      if (!googleData) return sendError("Invalid Google token", 401);
      verifiedEmail = googleData.email;
      providerUserId = googleData.sub;
      verifiedFirstName = googleData.given_name;
      verifiedLastName = googleData.family_name;
      verifiedAvatarUrl = googleData.picture;
    } else if (provider === "github") {
      const githubData = await verifyGithubToken(accessToken);
      if (!githubData) return sendError("Invalid GitHub token", 401);
      verifiedEmail = githubData.email;
      providerUserId = githubData.sub;
      if (githubData.name) {
        const nameParts = githubData.name.split(" ");
        verifiedFirstName = nameParts[0];
        verifiedLastName = nameParts.slice(1).join(" ");
      }
      verifiedAvatarUrl = githubData.picture;
    } else if (provider === "facebook") {
      const facebookData = await verifyFacebookToken(accessToken);
      if (!facebookData) return sendError("Invalid Facebook token", 401);
      verifiedEmail = facebookData.email;
      providerUserId = facebookData.sub;
      verifiedFirstName = facebookData.first_name;
      verifiedLastName = facebookData.last_name;
      verifiedAvatarUrl = facebookData.picture;
    }
    if (!verifiedEmail) {
      return sendError("Email is required. Please ensure your account has a verified email.");
    }
    let [existingUser] = await db.select().from(users).where(eq3(users.email, verifiedEmail)).limit(1);
    let userId;
    if (existingUser) {
      userId = existingUser.id;
      await db.update(users).set({
        provider,
        providerUserId,
        lastLoginAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        ...verifiedFirstName ? { firstName: verifiedFirstName } : {},
        ...verifiedLastName ? { lastName: verifiedLastName } : {},
        ...verifiedAvatarUrl ? { avatarUrl: verifiedAvatarUrl } : {}
      }).where(eq3(users.id, userId));
    } else {
      const [newUser] = await db.insert(users).values({
        email: verifiedEmail,
        firstName: verifiedFirstName || null,
        lastName: verifiedLastName || null,
        avatarUrl: verifiedAvatarUrl || null,
        provider,
        providerUserId,
        isVerified: true,
        lastLoginAt: /* @__PURE__ */ new Date()
      }).returning();
      userId = newUser.id;
      await db.insert(notificationPreferences).values({ userId });
    }
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const [session] = await db.insert(userSessions).values({ userId, token: crypto.randomUUID(), expiresAt }).returning();
    const jwtToken = generateToken(userId, session.id);
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: users.avatarUrl,
      provider: users.provider,
      isVerified: users.isVerified,
      isAccredited: users.isAccredited,
      createdAt: users.createdAt
    }).from(users).where(eq3(users.id, userId)).limit(1);
    const userData = {
      ...user,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || void 0
    };
    console.log(`[OAuth Callback] Success: ${verifiedEmail} via ${provider}, flow: ${stateData.flow}`);
    if (stateData.flow === "popup") {
      console.log(`[OAuth Callback] Popup flow - sending postMessage with token`);
      return res.send(getPopupPostMessagePage(jwtToken, userData));
    }
    if (stateData.flow === "mobile" && stateData.appRedirectUri) {
      const appUri = stateData.appRedirectUri;
      const separator = appUri.includes("?") ? "&" : "?";
      const redirectUrl = `${appUri}${separator}token=${encodeURIComponent(jwtToken)}`;
      console.log(`[OAuth Callback] Redirecting to mobile app: ${redirectUrl}`);
      if (appUri.startsWith("http")) {
        return res.redirect(redirectUrl);
      }
      return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirecting...</title></head><body><p>Redirecting to app...</p><script>window.location.href=${JSON.stringify(redirectUrl)};</script></body></html>`);
    }
    console.log(`[OAuth Callback] Landing page flow - redirecting with auth token`);
    const baseUri = getBaseUri();
    const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
    return res.redirect(`${baseUri}/?auth_token=${encodeURIComponent(jwtToken)}&auth_user=${userDataEncoded}`);
  } catch (error) {
    console.error("[OAuth Callback] Error:", error);
    return res.status(500).send(getOAuthResultPage("error", "Authentication failed. Please try again."));
  }
});
function getOAuthResultPage(status, message, token, user, appRedirectUri) {
  const isSuccess = status === "success";
  const deepLinkUrl = appRedirectUri ? `${appRedirectUri}${appRedirectUri.includes("?") ? "&" : "?"}token=${token}` : `medinvest://auth?token=${token}`;
  const userJson = user ? JSON.stringify(user).replace(/</g, "\\u003c").replace(/>/g, "\\u003e") : "null";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MedInvest - ${isSuccess ? "Login Successful" : "Login Failed"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; padding: 40px; max-width: 400px; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #999; font-size: 16px; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0066CC, #00A86B); color: #fff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; border: none; cursor: pointer; }
    .spinner { border: 3px solid #333; border-top: 3px solid #0066CC; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; display: inline-block; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    ${isSuccess ? `
      <div class="spinner"></div>
      <h1>Login Successful</h1>
      <p id="status-msg">Signing you in...</p>
      <script>
        (function() {
          try {
            var token = ${JSON.stringify(token || "")};
            var userData = ${userJson};
            var deepLink = ${JSON.stringify(deepLinkUrl)};
            var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            // Store token and user data in cookies for the app to read
            document.cookie = 'medinvest_auth_token=' + encodeURIComponent(token) + '; Path=/; Max-Age=300; SameSite=Lax; Secure';
            if (userData) {
              document.cookie = 'medinvest_auth_user=' + encodeURIComponent(JSON.stringify(userData)) + '; Path=/; Max-Age=300; SameSite=Lax; Secure';
            }

            // Also store in localStorage as backup for the Expo web app
            try {
              localStorage.setItem('medinvest_oauth_token', token);
              if (userData) localStorage.setItem('medinvest_oauth_user', JSON.stringify(userData));
            } catch(e) {}

            if (isMobile) {
              // Try deep link for native app
              document.getElementById('status-msg').textContent = 'Opening the app...';
              window.location.href = deepLink;
              setTimeout(function() {
                window.location.href = 'medinvest://auth?token=' + encodeURIComponent(token);
              }, 500);
              setTimeout(function() {
                document.getElementById('status-msg').textContent = 'Login successful! You can return to the app.';
              }, 3000);
            } else {
              // Web: redirect to app root so cookie-reading code picks it up
              document.getElementById('status-msg').textContent = 'Redirecting...';
              setTimeout(function() {
                window.location.href = '/';
              }, 500);
            }
          } catch(e) {
            document.getElementById('status-msg').textContent = 'Login successful! You can close this tab.';
          }
        })();
      </script>
    ` : `
      <div class="icon">&#10060;</div>
      <h1>Login Failed</h1>
      <p>${message}</p>
      <a href="/" class="btn">Try Again</a>
    `}
  </div>
</body>
</html>`;
}
function getPopupPostMessagePage(token, user) {
  const userJson = JSON.stringify(user).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MedInvest - Login Successful</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; padding: 40px; max-width: 400px; }
    .spinner { border: 3px solid #333; border-top: 3px solid #0066CC; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; display: inline-block; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #999; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Login Successful</h1>
    <p id="status">Completing sign-in...</p>
  </div>
  <script>
    (function() {
      var token = ${JSON.stringify(token)};
      var user = ${userJson};
      var sent = false;

      try {
        localStorage.setItem('medinvest_oauth_token', token);
        localStorage.setItem('medinvest_oauth_user', JSON.stringify(user));
      } catch(e) {}

      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'medinvest-oauth-success', token: token, user: user }, '*');
          sent = true;
        }
      } catch(e) {}

      if (sent) {
        document.getElementById('status').textContent = 'You can close this window.';
        setTimeout(function() { try { window.close(); } catch(e) {} }, 1500);
      } else {
        document.getElementById('status').textContent = 'Completing sign-in...';
        setTimeout(function() {
          document.getElementById('status').textContent = 'You can close this window and return to the app.';
        }, 2000);
      }
    })();
  </script>
</body>
</html>`;
}
function getPopupErrorPage(message) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MedInvest - Login Failed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; padding: 40px; max-width: 400px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #999; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Login Failed</h1>
    <p>${message}</p>
  </div>
  <script>
    (function() {
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'medinvest-oauth-error', error: ${JSON.stringify(message)} }, '*');
          setTimeout(function() { window.close(); }, 3000);
        }
      } catch(e) {}
    })();
  </script>
</body>
</html>`;
}
router.post("/social", async (req, res) => {
  try {
    const { provider, token, email, firstName, lastName, avatarUrl, identityToken } = req.body;
    if (!provider || !token) {
      res.status(400).json({ message: "Provider and token are required" });
      return;
    }
    let verifiedEmail;
    let providerUserId;
    let verifiedFirstName;
    let verifiedLastName;
    let verifiedAvatarUrl;
    if (provider === "apple") {
      const appleData = await verifyAppleToken(identityToken || token);
      if (!appleData) {
        res.status(401).json({ message: "Invalid Apple token" });
        return;
      }
      verifiedEmail = appleData.email || email;
      providerUserId = appleData.sub;
      verifiedFirstName = firstName;
      verifiedLastName = lastName;
      verifiedAvatarUrl = avatarUrl;
    } else if (provider === "google") {
      const googleData = await verifyGoogleToken(token);
      if (!googleData) {
        res.status(401).json({ message: "Invalid Google token" });
        return;
      }
      verifiedEmail = googleData.email || email;
      providerUserId = googleData.sub;
      verifiedFirstName = googleData.given_name || firstName;
      verifiedLastName = googleData.family_name || lastName;
      verifiedAvatarUrl = googleData.picture || avatarUrl;
    } else if (provider === "github") {
      const githubData = await verifyGithubToken(token);
      if (!githubData) {
        res.status(401).json({ message: "Invalid GitHub token" });
        return;
      }
      verifiedEmail = githubData.email || email;
      providerUserId = githubData.sub;
      if (githubData.name) {
        const nameParts = githubData.name.split(" ");
        verifiedFirstName = nameParts[0] || firstName;
        verifiedLastName = nameParts.slice(1).join(" ") || lastName;
      } else {
        verifiedFirstName = firstName;
        verifiedLastName = lastName;
      }
      verifiedAvatarUrl = githubData.picture || avatarUrl;
    } else if (provider === "facebook") {
      const facebookData = await verifyFacebookToken(token);
      if (!facebookData) {
        res.status(401).json({ message: "Invalid Facebook token" });
        return;
      }
      verifiedEmail = facebookData.email || email;
      providerUserId = facebookData.sub;
      verifiedFirstName = facebookData.first_name || firstName;
      verifiedLastName = facebookData.last_name || lastName;
      verifiedAvatarUrl = facebookData.picture || avatarUrl;
    } else {
      res.status(400).json({ message: "Invalid provider" });
      return;
    }
    if (!verifiedEmail) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    let [existingUser] = await db.select().from(users).where(eq3(users.email, verifiedEmail)).limit(1);
    let userId;
    if (existingUser) {
      userId = existingUser.id;
      await db.update(users).set({
        provider,
        providerUserId,
        lastLoginAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        // Always update profile data from social provider if available
        ...verifiedFirstName ? { firstName: verifiedFirstName } : {},
        ...verifiedLastName ? { lastName: verifiedLastName } : {},
        ...verifiedAvatarUrl ? { avatarUrl: verifiedAvatarUrl } : {}
      }).where(eq3(users.id, userId));
    } else {
      const [newUser] = await db.insert(users).values({
        email: verifiedEmail,
        firstName: verifiedFirstName,
        lastName: verifiedLastName,
        avatarUrl: verifiedAvatarUrl,
        provider,
        providerUserId,
        isVerified: true,
        // Social auth users are auto-verified
        lastLoginAt: /* @__PURE__ */ new Date()
      }).returning();
      userId = newUser.id;
      await db.insert(notificationPreferences).values({
        userId
      });
    }
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const [session] = await db.insert(userSessions).values({
      userId,
      token: crypto.randomUUID(),
      expiresAt
    }).returning();
    const jwtToken = generateToken(userId, session.id);
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: users.avatarUrl,
      provider: users.provider,
      isVerified: users.isVerified,
      isAccredited: users.isAccredited,
      createdAt: users.createdAt
    }).from(users).where(eq3(users.id, userId)).limit(1);
    res.json({
      token: jwtToken,
      user: {
        ...user,
        fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || void 0
      }
    });
  } catch (error) {
    console.error("Social auth error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      provider: users.provider,
      isVerified: users.isVerified,
      isAccredited: users.isAccredited,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq3(users.id, req.user.id)).limit(1);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({
      ...user,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || void 0
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to get profile" });
  }
});
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const [updatedUser] = await db.update(users).set({
      firstName,
      lastName,
      phone,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(users.id, req.user.id)).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      provider: users.provider,
      isVerified: users.isVerified,
      isAccredited: users.isAccredited,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    });
    res.json({
      ...updatedUser,
      fullName: [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" ") || void 0
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    await db.delete(userSessions).where(eq3(userSessions.token, req.token));
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});
router.post("/logout-all", authMiddleware, async (req, res) => {
  try {
    await db.delete(userSessions).where(eq3(userSessions.userId, req.user.id));
    res.json({ message: "Logged out from all devices" });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});
router.post("/demo", async (req, res) => {
  try {
    const demoEmail = "demo@medinvest.com";
    let [demoUser] = await db.select().from(users).where(eq3(users.email, demoEmail)).limit(1);
    const demoPassword = "Demo1234!";
    const demoPasswordHash = await bcrypt.hash(demoPassword, 10);
    if (!demoUser) {
      [demoUser] = await db.insert(users).values({
        email: demoEmail,
        firstName: "Demo",
        lastName: "User",
        provider: "demo",
        passwordHash: demoPasswordHash,
        isVerified: true,
        lastLoginAt: /* @__PURE__ */ new Date()
      }).returning();
      await db.insert(notificationPreferences).values({
        userId: demoUser.id
      });
    } else {
      await db.update(users).set({ lastLoginAt: /* @__PURE__ */ new Date(), passwordHash: demoPasswordHash, isVerified: true }).where(eq3(users.id, demoUser.id));
    }
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const [session] = await db.insert(userSessions).values({
      userId: demoUser.id,
      token: crypto.randomUUID(),
      expiresAt
    }).returning();
    const jwtToken = generateToken(demoUser.id, session.id);
    res.json({
      token: jwtToken,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        isVerified: demoUser.isVerified,
        fullName: [demoUser.firstName, demoUser.lastName].filter(Boolean).join(" "),
        provider: "demo"
      }
    });
  } catch (error) {
    console.error("Demo login error:", error);
    res.status(500).json({ message: "Demo login failed" });
  }
});
router.get("/fb-delete", (_req, res) => {
  res.redirect("/api/auth/facebook/data-deletion");
});
router.post("/facebook/setup-deletion-url", async (req, res) => {
  try {
    const appId = getFacebookAppId();
    const appSecret = getFacebookAppSecret();
    if (!appId || !appSecret) {
      res.status(500).json({ message: "Facebook credentials not configured" });
      return;
    }
    const callbackDomain = process.env.FACEBOOK_CALLBACK_DOMAIN || req.get("host");
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const deletionUrl = `${protocol}://${callbackDomain}/api/auth/facebook/data-deletion`;
    const appAccessToken = `${appId}|${appSecret}`;
    const graphUrl = new URL(`https://graph.facebook.com/v18.0/${appId}`);
    const updateResponse = await fetch(graphUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        access_token: appAccessToken,
        user_data_deletion_callback_url: deletionUrl
      }).toString()
    });
    const result = await updateResponse.json();
    if (result.error) {
      console.error("[Facebook Setup] Error setting deletion URL:", result.error);
      res.status(400).json({ message: result.error.message, deletionUrl });
      return;
    }
    console.log("[Facebook Setup] Successfully set data deletion URL:", deletionUrl);
    res.json({ success: true, deletionUrl, result });
  } catch (error) {
    console.error("[Facebook Setup] Error:", error);
    res.status(500).json({ message: "Failed to set deletion URL" });
  }
});
router.get("/facebook/data-deletion", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Data Deletion - MedInvest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #333; }
    h1 { color: #1a73e8; }
    ol { line-height: 1.8; }
    .contact { background: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Data Deletion Request</h1>
  <p>If you signed in to MedInvest using Facebook, you can request deletion of your data by following these steps:</p>
  <ol>
    <li>Open the MedInvest app</li>
    <li>Go to your Profile</li>
    <li>Tap "Delete Account"</li>
    <li>Confirm the deletion</li>
  </ol>
  <p>Your data will be permanently deleted within 30 days of your request.</p>
  <p>You can also remove MedInvest from your Facebook settings:</p>
  <ol>
    <li>Go to your <a href="https://www.facebook.com/settings?tab=applications">Facebook App Settings</a></li>
    <li>Find MedInvest and click "Remove"</li>
  </ol>
  <div class="contact">
    <strong>Need help?</strong>
    <p>Contact us at support@medinvest.app to request data deletion.</p>
  </div>
</body>
</html>`);
});
router.post("/facebook/data-deletion", async (req, res) => {
  try {
    const { signed_request } = req.body;
    if (!signed_request) {
      res.status(400).json({ message: "Missing signed_request parameter" });
      return;
    }
    const confirmationCode = `del_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const statusUrl = `${protocol}://${req.get("host")}/api/auth/facebook/deletion-status?code=${confirmationCode}`;
    console.log(`Facebook data deletion request received. Confirmation: ${confirmationCode}`);
    res.json({
      url: statusUrl,
      confirmation_code: confirmationCode
    });
  } catch (error) {
    console.error("Facebook data deletion error:", error);
    res.status(500).json({ message: "Data deletion request failed" });
  }
});
router.post("/facebook/data-deletion/callback", async (req, res) => {
  try {
    const { signed_request } = req.body;
    if (!signed_request) {
      res.status(400).json({ message: "Missing signed_request parameter" });
      return;
    }
    const confirmationCode = `del_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const statusUrl = `${protocol}://${req.get("host")}/api/auth/facebook/deletion-status?code=${confirmationCode}`;
    console.log(`Facebook data deletion request received. Confirmation: ${confirmationCode}`);
    res.json({
      url: statusUrl,
      confirmation_code: confirmationCode
    });
  } catch (error) {
    console.error("Facebook data deletion error:", error);
    res.status(500).json({ message: "Data deletion request failed" });
  }
});
router.get("/facebook/deletion-status", (req, res) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).json({ message: "Missing confirmation code" });
    return;
  }
  res.json({
    confirmation_code: code,
    status: "completed",
    message: "Your data has been deleted from MedInvest."
  });
});
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    const [user] = await db.select().from(users).where(eq3(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.json({ success: true, message: "If an account with that email exists, we have sent password reset instructions." });
      return;
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: resetToken,
      expiresAt
    });
    console.log(`[Auth] Password reset requested for ${email}. Token: ${resetToken}`);
    res.json({
      success: true,
      message: "If an account with that email exists, we have sent password reset instructions."
    });
  } catch (error) {
    console.error("[Auth] Forgot password error:", error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ message: "Token and new password are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters" });
      return;
    }
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      res.status(400).json({
        message: "Password must contain uppercase, lowercase, and number"
      });
      return;
    }
    const [resetRecord] = await db.select().from(passwordResetTokens).where(
      and2(
        eq3(passwordResetTokens.token, token),
        gt2(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    ).limit(1);
    if (!resetRecord) {
      res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, resetRecord.userId));
    await db.update(passwordResetTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq3(passwordResetTokens.id, resetRecord.id));
    console.log(`[Auth] Password reset completed for user ${resetRecord.userId}`);
    res.json({ success: true, message: "Password has been reset successfully. You can now sign in with your new password." });
  } catch (error) {
    console.error("[Auth] Reset password error:", error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});
router.get("/oauth-debug", (req, res) => {
  const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host") || req.get("host");
  const currentOrigin = `${forwardedProto}://${forwardedHost}`;
  const callbackUri = `${currentOrigin}/api/auth/callback`;
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const pubDomains = process.env.REPLIT_DOMAINS;
  const allCallbackUris = [callbackUri];
  if (devDomain) {
    allCallbackUris.push(`https://${devDomain}/api/auth/callback`);
  }
  if (pubDomains) {
    const domainList = pubDomains.split(",");
    for (const d of domainList) {
      const uri = `https://${d.trim()}/api/auth/callback`;
      if (!allCallbackUris.includes(uri)) allCallbackUris.push(uri);
    }
  }
  const knownDomains = ["themedicineandmoneyshow.com", "medinvest-mobile--rsmolarz.replit.app"];
  for (const d of knownDomains) {
    const uri = `https://${d}/api/auth/callback`;
    if (!allCallbackUris.includes(uri)) allCallbackUris.push(uri);
  }
  const hasGoogle = !!getGoogleClientId();
  const hasGithub = !!getGithubClientId();
  const hasFacebook = !!getFacebookAppId();
  const html = `<!DOCTYPE html><html><head><title>OAuth Debug</title>
  <style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:20px;background:#1a1a2e;color:#e0e0e0}
  h1{color:#00a86b}h2{color:#0066cc;margin-top:30px}code{background:#2d2d44;padding:4px 8px;border-radius:4px;display:block;margin:5px 0;word-break:break-all;font-size:14px}
  .status{padding:4px 8px;border-radius:4px;font-weight:bold}.ok{background:#00a86b33;color:#00a86b}.missing{background:#cc000033;color:#cc4444}
  .section{background:#2d2d44;padding:15px;border-radius:8px;margin:10px 0}</style></head>
  <body><h1>OAuth Redirect URI Debug</h1>
  <div class="section"><h2>Current Request Origin</h2><code>${currentOrigin}</code></div>
  <div class="section"><h2>Callback URIs (used by OAuth start endpoints)</h2>
  <p>Google: <code>${getCallbackUri("google")}</code></p>
  <p>GitHub: <code>${getCallbackUri("github")}</code></p>
  <p>Facebook: <code>${getCallbackUri("facebook")}</code></p></div>
  <div class="section"><h2>All Redirect URIs to Register</h2>
  <p>Copy-paste ALL of these into each OAuth provider's console:</p>
  ${allCallbackUris.map((u) => `<code>${u}</code>`).join("")}</div>
  <div class="section"><h2>Provider Status</h2>
  <p>Google: <span class="status ${hasGoogle ? "ok" : "missing"}">${hasGoogle ? "Configured" : "Missing credentials"}</span></p>
  <p>GitHub: <span class="status ${hasGithub ? "ok" : "missing"}">${hasGithub ? "Configured" : "Missing credentials"}</span></p>
  <p>Facebook: <span class="status ${hasFacebook ? "ok" : "missing"}">${hasFacebook ? "Configured" : "Missing credentials"}</span></p></div>
  <div class="section"><h2>Google Console Setup</h2>
  <p>In <a href="https://console.cloud.google.com/apis/credentials" style="color:#00a86b">Google Cloud Console</a>:</p>
  <p><b>Authorized JavaScript Origins:</b></p>
  ${[...new Set(allCallbackUris.map((u) => u.replace(/\/api\/auth\/callback$/, "")))].map((u) => `<code>${u}</code>`).join("")}
  <p><b>Authorized Redirect URIs:</b></p>
  ${allCallbackUris.map((u) => `<code>${u}</code>`).join("")}
  <p><b>OAuth Consent Screen:</b> Must be "External" user type and "In production" (or add test users)</p></div>
  <div class="section"><h2>GitHub Console Setup</h2>
  <p>In <a href="https://github.com/settings/developers" style="color:#00a86b">GitHub Developer Settings</a>:</p>
  <p><b>Authorization callback URL:</b> (can only have ONE per app)</p>
  <code>${callbackUri}</code>
  <p>Note: If testing from multiple domains, you may need separate GitHub OAuth apps.</p></div>
  <div class="section"><h2>Facebook Console Setup</h2>
  <p>In <a href="https://developers.facebook.com" style="color:#00a86b">Facebook Developers</a> &gt; App Settings &gt; Facebook Login &gt; Settings:</p>
  <p><b>Valid OAuth Redirect URIs:</b></p>
  ${allCallbackUris.map((u) => `<code>${u}</code>`).join("")}</div>
  </body></html>`;
  res.send(html);
});
router.get("/cred-check", (req, res) => {
  const mask = (s) => s ? `${s.substring(0, 12)}...${s.slice(-4)} (len=${s.length})` : "UNDEFINED";
  const raw = (key) => {
    const v = process.env[key];
    return v ? `raw_len=${v.length}, cleaned_len=${cleanEnv(key)?.length || 0}` : "NOT SET";
  };
  const googleId = getGoogleClientId();
  const googleSecret = getGoogleClientSecret();
  res.json({
    google_client_id: mask(googleId),
    google_client_secret: mask(googleSecret),
    env_detail: {
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: raw("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"),
      GOOGLE_WEB_CLIENT_ID: raw("GOOGLE_WEB_CLIENT_ID"),
      GOOGLE_WEB_CLIENT_SECRET: raw("GOOGLE_WEB_CLIENT_SECRET")
    },
    github_client_id: mask(getGithubClientId()),
    facebook_app_id: mask(getFacebookAppId())
  });
});
var auth_default = router;

// server/routes/investments.ts
import { Router as Router2 } from "express";
import { eq as eq4, and as and3, or, gte, lte, desc as desc2, asc, sql as sql2, ilike } from "drizzle-orm";
var router2 = Router2();
function calculateDaysRemaining(endDate) {
  const now = /* @__PURE__ */ new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
function formatInvestment(inv) {
  return {
    id: inv.id,
    name: inv.name,
    description: inv.description,
    longDescription: inv.longDescription,
    category: inv.category,
    fundingGoal: parseFloat(inv.fundingGoal),
    fundingCurrent: parseFloat(inv.fundingCurrent),
    minimumInvestment: parseFloat(inv.minimumInvestment),
    expectedROI: inv.expectedRoiMin && inv.expectedRoiMax ? `${inv.expectedRoiMin}-${inv.expectedRoiMax}%` : inv.expectedRoiMin ? `${inv.expectedRoiMin}%+` : "TBD",
    riskLevel: inv.riskLevel,
    status: inv.status,
    imageUrl: inv.imageUrl,
    daysRemaining: calculateDaysRemaining(new Date(inv.endDate)),
    startDate: inv.startDate,
    endDate: inv.endDate,
    investors: inv.investorCount,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt
  };
}
router2.get("/", optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      category,
      riskLevel,
      status = "active",
      minInvestment,
      maxInvestment,
      sortBy = "newest"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const conditions = [];
    if (status) {
      conditions.push(eq4(investments.status, status));
    }
    if (category) {
      conditions.push(eq4(investments.category, category));
    }
    if (riskLevel) {
      conditions.push(eq4(investments.riskLevel, riskLevel));
    }
    if (minInvestment) {
      conditions.push(gte(investments.minimumInvestment, minInvestment));
    }
    if (maxInvestment) {
      conditions.push(lte(investments.minimumInvestment, maxInvestment));
    }
    let orderBy;
    switch (sortBy) {
      case "endingSoon":
        orderBy = asc(investments.endDate);
        break;
      case "mostFunded":
        orderBy = desc2(investments.fundingCurrent);
        break;
      case "highestROI":
        orderBy = desc2(investments.expectedRoiMax);
        break;
      case "newest":
      default:
        orderBy = desc2(investments.createdAt);
    }
    const whereClause = conditions.length > 0 ? and3(...conditions) : void 0;
    const [investmentsList, [countResult]] = await Promise.all([
      db.select().from(investments).where(whereClause).orderBy(orderBy).limit(limitNum).offset(offset),
      db.select({ count: sql2`count(*)::int` }).from(investments).where(whereClause)
    ]);
    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);
    res.json({
      data: investmentsList.map(formatInvestment),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages
    });
  } catch (error) {
    console.error("List investments error:", error);
    res.status(500).json({ message: "Failed to fetch investments" });
  }
});
router2.get("/search", optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      q = "",
      page = "1",
      limit = "10",
      category,
      riskLevel
    } = req.query;
    const searchQuery = q.trim();
    if (searchQuery.length < 2) {
      res.json({
        data: [],
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasMore: false
      });
      return;
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const conditions = [
      eq4(investments.status, "active"),
      or(
        ilike(investments.name, `%${searchQuery}%`),
        ilike(investments.description, `%${searchQuery}%`)
      )
    ];
    if (category) {
      conditions.push(eq4(investments.category, category));
    }
    if (riskLevel) {
      conditions.push(eq4(investments.riskLevel, riskLevel));
    }
    const whereClause = and3(...conditions);
    const [investmentsList, [countResult]] = await Promise.all([
      db.select().from(investments).where(whereClause).orderBy(desc2(investments.createdAt)).limit(limitNum).offset(offset),
      db.select({ count: sql2`count(*)::int` }).from(investments).where(whereClause)
    ]);
    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);
    res.json({
      data: investmentsList.map(formatInvestment),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages
    });
  } catch (error) {
    console.error("Search investments error:", error);
    res.status(500).json({ message: "Failed to search investments" });
  }
});
router2.get("/:id", optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [investment] = await db.select().from(investments).where(eq4(investments.id, id)).limit(1);
    if (!investment) {
      res.status(404).json({ message: "Investment not found" });
      return;
    }
    const [documents, teamMembers, milestones] = await Promise.all([
      db.select().from(investmentDocuments).where(eq4(investmentDocuments.investmentId, id)),
      db.select().from(investmentTeamMembers).where(eq4(investmentTeamMembers.investmentId, id)).orderBy(investmentTeamMembers.sortOrder),
      db.select().from(investmentMilestones).where(eq4(investmentMilestones.investmentId, id)).orderBy(investmentMilestones.sortOrder)
    ]);
    res.json({
      ...formatInvestment(investment),
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        url: d.url
      })),
      team: teamMembers.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        avatarUrl: t.avatarUrl,
        linkedInUrl: t.linkedInUrl
      })),
      milestones: milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        targetDate: m.targetDate,
        completed: m.completed,
        completedAt: m.completedAt
      }))
    });
  } catch (error) {
    console.error("Get investment error:", error);
    res.status(500).json({ message: "Failed to fetch investment" });
  }
});
router2.get("/categories/stats", async (req, res) => {
  try {
    const stats = await db.select({
      category: investments.category,
      count: sql2`count(*)::int`
    }).from(investments).where(eq4(investments.status, "active")).groupBy(investments.category);
    res.json(stats);
  } catch (error) {
    console.error("Get category stats error:", error);
    res.status(500).json({ message: "Failed to fetch category stats" });
  }
});
var investments_default = router2;

// server/routes/portfolio.ts
import { Router as Router3 } from "express";
import { eq as eq5, and as and4, desc as desc3, sql as sql3 } from "drizzle-orm";
var router3 = Router3();
router3.use(authMiddleware);
router3.get("/summary", async (req, res) => {
  try {
    const userId = req.user.id;
    const userInvestments = await db.select({
      amountInvested: portfolioInvestments.amountInvested,
      currentValue: portfolioInvestments.currentValue,
      status: portfolioInvestments.status
    }).from(portfolioInvestments).where(eq5(portfolioInvestments.userId, userId));
    let totalInvested = 0;
    let totalValue = 0;
    let activeCount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    for (const inv of userInvestments) {
      const invested = parseFloat(inv.amountInvested);
      const current = parseFloat(inv.currentValue);
      totalInvested += invested;
      totalValue += current;
      switch (inv.status) {
        case "active":
          activeCount++;
          break;
        case "completed":
          completedCount++;
          break;
        case "pending":
          pendingCount++;
          break;
      }
    }
    const totalGainLoss = totalValue - totalInvested;
    const gainLossPercent = totalInvested > 0 ? totalGainLoss / totalInvested * 100 : 0;
    res.json({
      totalValue,
      totalInvested,
      totalGainLoss,
      gainLossPercent: Math.round(gainLossPercent * 100) / 100,
      activeInvestments: activeCount,
      completedInvestments: completedCount,
      pendingInvestments: pendingCount
    });
  } catch (error) {
    console.error("Get portfolio summary error:", error);
    res.status(500).json({ message: "Failed to fetch portfolio summary" });
  }
});
router3.get("/investments", async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = "1", limit = "20", status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const conditions = [eq5(portfolioInvestments.userId, userId)];
    if (status) {
      conditions.push(eq5(portfolioInvestments.status, status));
    }
    const whereClause = and4(...conditions);
    const [userInvestments, [countResult]] = await Promise.all([
      db.select({
        id: portfolioInvestments.id,
        investmentId: portfolioInvestments.investmentId,
        amountInvested: portfolioInvestments.amountInvested,
        currentValue: portfolioInvestments.currentValue,
        status: portfolioInvestments.status,
        investedAt: portfolioInvestments.investedAt,
        name: investments.name,
        category: investments.category,
        imageUrl: investments.imageUrl
      }).from(portfolioInvestments).innerJoin(investments, eq5(portfolioInvestments.investmentId, investments.id)).where(whereClause).orderBy(desc3(portfolioInvestments.investedAt)).limit(limitNum).offset(offset),
      db.select({ count: sql3`count(*)::int` }).from(portfolioInvestments).where(whereClause)
    ]);
    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);
    const data = userInvestments.map((inv) => {
      const amountInvested = parseFloat(inv.amountInvested);
      const currentValue = parseFloat(inv.currentValue);
      const gainLossPercent = amountInvested > 0 ? (currentValue - amountInvested) / amountInvested * 100 : 0;
      return {
        id: inv.id,
        investmentId: inv.investmentId,
        name: inv.name,
        category: inv.category,
        imageUrl: inv.imageUrl,
        amountInvested,
        currentValue,
        gainLossPercent: Math.round(gainLossPercent * 100) / 100,
        status: inv.status,
        investedAt: inv.investedAt
      };
    });
    res.json({
      data,
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages
    });
  } catch (error) {
    console.error("Get portfolio investments error:", error);
    res.status(500).json({ message: "Failed to fetch portfolio investments" });
  }
});
router3.post("/invest", async (req, res) => {
  try {
    const userId = req.user.id;
    const { investmentId, amount, paymentMethodId } = req.body;
    if (!investmentId || !amount || !paymentMethodId) {
      res.status(400).json({
        message: "Investment ID, amount, and payment method are required"
      });
      return;
    }
    const investmentAmount = parseFloat(amount);
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      res.status(400).json({ message: "Invalid investment amount" });
      return;
    }
    const [investment] = await db.select().from(investments).where(eq5(investments.id, investmentId)).limit(1);
    if (!investment) {
      res.status(404).json({ message: "Investment not found" });
      return;
    }
    if (investment.status !== "active") {
      res.status(400).json({ message: "Investment is not currently accepting funds" });
      return;
    }
    const minimumInvestment = parseFloat(investment.minimumInvestment);
    if (investmentAmount < minimumInvestment) {
      res.status(400).json({
        message: `Minimum investment is $${minimumInvestment.toLocaleString()}`
      });
      return;
    }
    const [paymentMethod] = await db.select().from(paymentMethods).where(
      and4(
        eq5(paymentMethods.id, paymentMethodId),
        eq5(paymentMethods.userId, userId)
      )
    ).limit(1);
    if (!paymentMethod) {
      res.status(404).json({ message: "Payment method not found" });
      return;
    }
    const [existingInvestment] = await db.select().from(portfolioInvestments).where(
      and4(
        eq5(portfolioInvestments.userId, userId),
        eq5(portfolioInvestments.investmentId, investmentId)
      )
    ).limit(1);
    let portfolioInvestment;
    if (existingInvestment) {
      const newAmount = parseFloat(existingInvestment.amountInvested) + investmentAmount;
      [portfolioInvestment] = await db.update(portfolioInvestments).set({
        amountInvested: newAmount.toString(),
        currentValue: newAmount.toString(),
        // Initially same as invested
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(portfolioInvestments.id, existingInvestment.id)).returning();
    } else {
      [portfolioInvestment] = await db.insert(portfolioInvestments).values({
        userId,
        investmentId,
        amountInvested: investmentAmount.toString(),
        currentValue: investmentAmount.toString(),
        status: "pending"
      }).returning();
    }
    const [transaction] = await db.insert(transactions).values({
      userId,
      portfolioInvestmentId: portfolioInvestment.id,
      type: "investment",
      amount: investmentAmount.toString(),
      status: "pending",
      paymentMethodId
    }).returning();
    await db.update(investments).set({
      fundingCurrent: sql3`${investments.fundingCurrent} + ${investmentAmount}`,
      investorCount: existingInvestment ? investments.investorCount : sql3`${investments.investorCount} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(investments.id, investmentId));
    res.status(201).json({
      message: "Investment submitted successfully",
      portfolioInvestment: {
        id: portfolioInvestment.id,
        investmentId: portfolioInvestment.investmentId,
        amountInvested: parseFloat(portfolioInvestment.amountInvested),
        status: portfolioInvestment.status
      },
      transaction: {
        id: transaction.id,
        amount: parseFloat(transaction.amount),
        status: transaction.status
      }
    });
  } catch (error) {
    console.error("Create investment error:", error);
    res.status(500).json({ message: "Failed to process investment" });
  }
});
router3.get("/transactions", async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = "1", limit = "20", type } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const conditions = [eq5(transactions.userId, userId)];
    if (type) {
      conditions.push(eq5(transactions.type, type));
    }
    const whereClause = and4(...conditions);
    const [userTransactions, [countResult]] = await Promise.all([
      db.select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
        completedAt: transactions.completedAt,
        investmentName: investments.name
      }).from(transactions).leftJoin(
        portfolioInvestments,
        eq5(transactions.portfolioInvestmentId, portfolioInvestments.id)
      ).leftJoin(investments, eq5(portfolioInvestments.investmentId, investments.id)).where(whereClause).orderBy(desc3(transactions.createdAt)).limit(limitNum).offset(offset),
      db.select({ count: sql3`count(*)::int` }).from(transactions).where(whereClause)
    ]);
    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);
    res.json({
      data: userTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        status: t.status,
        investmentName: t.investmentName,
        createdAt: t.createdAt,
        completedAt: t.completedAt
      })),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});
var portfolio_default = router3;

// server/routes/articles.ts
import { Router as Router4 } from "express";
import { eq as eq6, and as and5, desc as desc4, asc as asc2, sql as sql4, ilike as ilike2, or as or2 } from "drizzle-orm";
var router4 = Router4();
function formatArticle(article, isBookmarked = false) {
  let tags = [];
  try {
    tags = article.tags ? JSON.parse(article.tags) : [];
  } catch {
    tags = [];
  }
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    content: article.content,
    source: article.source,
    sourceUrl: article.sourceUrl,
    author: article.author,
    imageUrl: article.imageUrl,
    category: article.category,
    tags,
    readTime: article.readTime,
    isFeatured: article.isFeatured,
    isBookmarked,
    viewCount: article.viewCount,
    publishedAt: article.publishedAt
  };
}
router4.get("/", optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      page = "1",
      limit = "15",
      category,
      featured,
      search,
      sortBy = "newest"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const conditions = [];
    if (category) {
      conditions.push(eq6(articles.category, category));
    }
    if (featured === "true") {
      conditions.push(eq6(articles.isFeatured, true));
    }
    if (search) {
      conditions.push(
        or2(
          ilike2(articles.title, `%${search}%`),
          ilike2(articles.summary, `%${search}%`)
        )
      );
    }
    let orderBy;
    switch (sortBy) {
      case "popular":
        orderBy = desc4(articles.viewCount);
        break;
      case "readTime":
        orderBy = asc2(articles.readTime);
        break;
      case "newest":
      default:
        orderBy = desc4(articles.publishedAt);
    }
    const whereClause = conditions.length > 0 ? and5(...conditions) : void 0;
    const [articlesList, [countResult]] = await Promise.all([
      db.select().from(articles).where(whereClause).orderBy(orderBy).limit(limitNum).offset(offset),
      db.select({ count: sql4`count(*)::int` }).from(articles).where(whereClause)
    ]);
    let bookmarkedIds = /* @__PURE__ */ new Set();
    if (req.user) {
      const bookmarks = await db.select({ articleId: articleBookmarks.articleId }).from(articleBookmarks).where(eq6(articleBookmarks.userId, req.user.id));
      bookmarkedIds = new Set(bookmarks.map((b) => b.articleId));
    }
    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);
    res.json({
      data: articlesList.map((a) => formatArticle(a, bookmarkedIds.has(a.id))),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages
    });
  } catch (error) {
    console.error("List articles error:", error);
    res.status(500).json({ message: "Failed to fetch articles" });
  }
});
router4.get("/bookmarked", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = "1", limit = "15" } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const [bookmarkedArticles, [countResult]] = await Promise.all([
      db.select({
        id: articles.id,
        title: articles.title,
        summary: articles.summary,
        source: articles.source,
        sourceUrl: articles.sourceUrl,
        author: articles.author,
        imageUrl: articles.imageUrl,
        category: articles.category,
        tags: articles.tags,
        readTime: articles.readTime,
        isFeatured: articles.isFeatured,
        viewCount: articles.viewCount,
        publishedAt: articles.publishedAt,
        bookmarkedAt: articleBookmarks.createdAt
      }).from(articleBookmarks).innerJoin(articles, eq6(articleBookmarks.articleId, articles.id)).where(eq6(articleBookmarks.userId, userId)).orderBy(desc4(articleBookmarks.createdAt)).limit(limitNum).offset(offset),
      db.select({ count: sql4`count(*)::int` }).from(articleBookmarks).where(eq6(articleBookmarks.userId, userId))
    ]);
    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);
    res.json({
      data: bookmarkedArticles.map((a) => formatArticle(a, true)),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages
    });
  } catch (error) {
    console.error("Get bookmarked articles error:", error);
    res.status(500).json({ message: "Failed to fetch bookmarked articles" });
  }
});
router4.get("/:id", optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [article] = await db.select().from(articles).where(eq6(articles.id, id)).limit(1);
    if (!article) {
      res.status(404).json({ message: "Article not found" });
      return;
    }
    await db.update(articles).set({ viewCount: sql4`${articles.viewCount} + 1` }).where(eq6(articles.id, id));
    let isBookmarked = false;
    if (req.user) {
      const [bookmark] = await db.select().from(articleBookmarks).where(
        and5(
          eq6(articleBookmarks.userId, req.user.id),
          eq6(articleBookmarks.articleId, id)
        )
      ).limit(1);
      isBookmarked = !!bookmark;
    }
    res.json(formatArticle(article, isBookmarked));
  } catch (error) {
    console.error("Get article error:", error);
    res.status(500).json({ message: "Failed to fetch article" });
  }
});
router4.post("/:id/bookmark", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [article] = await db.select({ id: articles.id }).from(articles).where(eq6(articles.id, id)).limit(1);
    if (!article) {
      res.status(404).json({ message: "Article not found" });
      return;
    }
    const [existingBookmark] = await db.select().from(articleBookmarks).where(
      and5(
        eq6(articleBookmarks.userId, userId),
        eq6(articleBookmarks.articleId, id)
      )
    ).limit(1);
    if (existingBookmark) {
      await db.delete(articleBookmarks).where(eq6(articleBookmarks.id, existingBookmark.id));
      res.json({ isBookmarked: false, message: "Bookmark removed" });
    } else {
      await db.insert(articleBookmarks).values({
        userId,
        articleId: id
      });
      res.json({ isBookmarked: true, message: "Article bookmarked" });
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res.status(500).json({ message: "Failed to toggle bookmark" });
  }
});
router4.get("/categories/list", async (req, res) => {
  try {
    const categories = await db.select({
      category: articles.category,
      count: sql4`count(*)::int`
    }).from(articles).groupBy(articles.category).orderBy(desc4(sql4`count(*)`));
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});
var articles_default = router4;

// server/routes/users.ts
import { Router as Router5 } from "express";
import { eq as eq7, and as and6, ne, or as or3, ilike as ilike3, sql as sql5 } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
var router5 = Router5();
router5.use(authMiddleware);
var storage = multer.diskStorage({
  destination: "./uploads/avatars",
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
var upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  }
});
router5.get("/me", async (req, res) => {
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      provider: users.provider,
      isVerified: users.isVerified,
      isAccredited: users.isAccredited,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq7(users.id, req.user.id)).limit(1);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({
      ...user,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || void 0
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});
router5.patch("/me", async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const [updatedUser] = await db.update(users).set({
      firstName,
      lastName,
      phone,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(users.id, req.user.id)).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      provider: users.provider,
      isVerified: users.isVerified,
      isAccredited: users.isAccredited,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    });
    res.json({
      ...updatedUser,
      fullName: [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" ") || void 0
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});
router5.post("/me/avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const [currentUser] = await db.select({ avatarUrl: users.avatarUrl }).from(users).where(eq7(users.id, req.user.id)).limit(1);
    if (currentUser?.avatarUrl && currentUser.avatarUrl.startsWith("/uploads/")) {
      try {
        await fs.unlink(`.${currentUser.avatarUrl}`);
      } catch {
      }
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const [updatedUser] = await db.update(users).set({
      avatarUrl,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(users.id, req.user.id)).returning({ avatarUrl: users.avatarUrl });
    res.json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
});
router5.post("/me/push-token", async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token) {
      res.status(400).json({ message: "Token is required" });
      return;
    }
    const [existingToken] = await db.select().from(pushTokens).where(eq7(pushTokens.token, token)).limit(1);
    if (existingToken) {
      if (existingToken.userId !== req.user.id) {
        await db.update(pushTokens).set({ userId: req.user.id }).where(eq7(pushTokens.id, existingToken.id));
      }
    } else {
      await db.insert(pushTokens).values({
        userId: req.user.id,
        token,
        platform
      });
    }
    res.json({ message: "Push token registered" });
  } catch (error) {
    console.error("Register push token error:", error);
    res.status(500).json({ message: "Failed to register push token" });
  }
});
router5.delete("/me/push-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ message: "Token is required" });
      return;
    }
    await db.delete(pushTokens).where(
      and6(
        eq7(pushTokens.userId, req.user.id),
        eq7(pushTokens.token, token)
      )
    );
    res.json({ message: "Push token unregistered" });
  } catch (error) {
    console.error("Unregister push token error:", error);
    res.status(500).json({ message: "Failed to unregister push token" });
  }
});
router5.get("/me/notification-preferences", async (req, res) => {
  try {
    let [prefs] = await db.select({
      investmentUpdates: notificationPreferences.investmentUpdates,
      newOpportunities: notificationPreferences.newOpportunities,
      portfolioMilestones: notificationPreferences.portfolioMilestones,
      articles: notificationPreferences.articles,
      marketing: notificationPreferences.marketing
    }).from(notificationPreferences).where(eq7(notificationPreferences.userId, req.user.id)).limit(1);
    if (!prefs) {
      [prefs] = await db.insert(notificationPreferences).values({ userId: req.user.id }).returning({
        investmentUpdates: notificationPreferences.investmentUpdates,
        newOpportunities: notificationPreferences.newOpportunities,
        portfolioMilestones: notificationPreferences.portfolioMilestones,
        articles: notificationPreferences.articles,
        marketing: notificationPreferences.marketing
      });
    }
    res.json(prefs);
  } catch (error) {
    console.error("Get notification preferences error:", error);
    res.status(500).json({ message: "Failed to fetch notification preferences" });
  }
});
router5.patch("/me/notification-preferences", async (req, res) => {
  try {
    const {
      investmentUpdates,
      newOpportunities,
      portfolioMilestones,
      articles: articles2,
      marketing
    } = req.body;
    const updateData = { updatedAt: /* @__PURE__ */ new Date() };
    if (investmentUpdates !== void 0) updateData.investmentUpdates = investmentUpdates;
    if (newOpportunities !== void 0) updateData.newOpportunities = newOpportunities;
    if (portfolioMilestones !== void 0) updateData.portfolioMilestones = portfolioMilestones;
    if (articles2 !== void 0) updateData.articles = articles2;
    if (marketing !== void 0) updateData.marketing = marketing;
    const [existing] = await db.select({ id: notificationPreferences.id }).from(notificationPreferences).where(eq7(notificationPreferences.userId, req.user.id)).limit(1);
    let prefs;
    if (existing) {
      [prefs] = await db.update(notificationPreferences).set(updateData).where(eq7(notificationPreferences.userId, req.user.id)).returning({
        investmentUpdates: notificationPreferences.investmentUpdates,
        newOpportunities: notificationPreferences.newOpportunities,
        portfolioMilestones: notificationPreferences.portfolioMilestones,
        articles: notificationPreferences.articles,
        marketing: notificationPreferences.marketing
      });
    } else {
      [prefs] = await db.insert(notificationPreferences).values({
        userId: req.user.id,
        ...updateData
      }).returning({
        investmentUpdates: notificationPreferences.investmentUpdates,
        newOpportunities: notificationPreferences.newOpportunities,
        portfolioMilestones: notificationPreferences.portfolioMilestones,
        articles: notificationPreferences.articles,
        marketing: notificationPreferences.marketing
      });
    }
    res.json(prefs);
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ message: "Failed to update notification preferences" });
  }
});
router5.get("/me/payment-methods", async (req, res) => {
  try {
    const methods = await db.select({
      id: paymentMethods.id,
      type: paymentMethods.type,
      name: paymentMethods.name,
      last4: paymentMethods.last4,
      expiryMonth: paymentMethods.expiryMonth,
      expiryYear: paymentMethods.expiryYear,
      bankName: paymentMethods.bankName,
      isDefault: paymentMethods.isDefault
    }).from(paymentMethods).where(eq7(paymentMethods.userId, req.user.id));
    res.json(methods);
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({ message: "Failed to fetch payment methods" });
  }
});
router5.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const searchTerm = String(q || "").trim();
    if (!searchTerm) {
      res.json({ users: [] });
      return;
    }
    const searchPattern = `%${searchTerm}%`;
    const results = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified
    }).from(users).where(
      and6(
        ne(users.id, req.user.id),
        or3(
          ilike3(users.firstName, searchPattern),
          ilike3(users.lastName, searchPattern),
          ilike3(users.email, searchPattern),
          sql5`CONCAT(${users.firstName}, ' ', ${users.lastName}) ILIKE ${searchPattern}`
        )
      )
    ).limit(20);
    const formattedUsers = results.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified
    }));
    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
});
router5.get("/explore", async (req, res) => {
  try {
    const results = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified
    }).from(users).where(ne(users.id, req.user.id)).limit(20);
    const formattedUsers = results.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified
    }));
    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Explore users error:", error);
    res.status(500).json({ message: "Failed to fetch suggested users" });
  }
});
router5.get("/:id/following", async (req, res) => {
  try {
    const results = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified
    }).from(users).where(ne(users.id, req.user.id)).limit(20);
    const formattedUsers = results.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified
    }));
    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ message: "Failed to fetch following users" });
  }
});
var users_default = router5;

// server/routes/ai.ts
import { Router as Router6 } from "express";

// server/services/ai.ts
import OpenAI2 from "openai";
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI API key not configured - AI features will be limited");
    return null;
  }
  return new OpenAI2({ apiKey });
}
async function moderateContent(content) {
  const openai2 = getOpenAIClient();
  if (!openai2) {
    return {
      flagged: false,
      categories: {
        harassment: false,
        hate: false,
        selfHarm: false,
        sexual: false,
        violence: false,
        spam: false,
        misinformation: false
      },
      confidence: 0,
      action: "allow"
    };
  }
  try {
    const moderation = await openai2.moderations.create({
      input: content
    });
    const result = moderation.results[0];
    const healthcareCheck = await analyzeHealthcareContent(content);
    return {
      flagged: result.flagged || healthcareCheck.flagged,
      categories: {
        harassment: result.categories.harassment,
        hate: result.categories.hate,
        selfHarm: result.categories["self-harm"],
        sexual: result.categories.sexual,
        violence: result.categories.violence,
        spam: healthcareCheck.isSpam,
        misinformation: healthcareCheck.isMisinformation
      },
      confidence: Math.max(...Object.values(result.category_scores)),
      action: determineAction(result, healthcareCheck),
      reason: healthcareCheck.reason
    };
  } catch (error) {
    console.error("Moderation error:", error);
    return {
      flagged: false,
      categories: {
        harassment: false,
        hate: false,
        selfHarm: false,
        sexual: false,
        violence: false,
        spam: false,
        misinformation: false
      },
      confidence: 0,
      action: "allow"
    };
  }
}
async function analyzeHealthcareContent(content) {
  const openai2 = getOpenAIClient();
  if (!openai2) return { flagged: false, isSpam: false, isMisinformation: false };
  try {
    const response = await openai2.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a healthcare content moderator. Analyze the following content for:
1. Medical misinformation (dangerous health claims, anti-vaccine content, etc.)
2. Spam or promotional content
3. Unverified medical advice that could be harmful

Respond in JSON format:
{
  "flagged": boolean,
  "isSpam": boolean,
  "isMisinformation": boolean,
  "reason": "explanation if flagged"
}`
        },
        {
          role: "user",
          content
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200
    });
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch {
    return { flagged: false, isSpam: false, isMisinformation: false };
  }
}
function determineAction(modResult, healthcareCheck) {
  if (modResult.categories.hate || modResult.categories["self-harm"] || healthcareCheck.isMisinformation) {
    return "block";
  }
  if (modResult.flagged || healthcareCheck.flagged) {
    return "flag";
  }
  return "allow";
}
async function summarizePost(content) {
  const openai2 = getOpenAIClient();
  if (!openai2) {
    return { summary: "", keyPoints: [], sentiment: "neutral", topics: [] };
  }
  const response = await openai2.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `Summarize healthcare investment content. Return JSON:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["key point 1", "key point 2"],
  "sentiment": "positive" | "negative" | "neutral",
  "topics": ["topic1", "topic2"]
}`
      },
      {
        role: "user",
        content
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 300
  });
  return JSON.parse(response.choices[0].message.content || "{}");
}
async function analyzeDeal(dealInfo) {
  const openai2 = getOpenAIClient();
  if (!openai2) {
    return { riskLevel: "medium", strengths: [], concerns: [], marketAnalysis: "", recommendation: "", keyMetrics: [] };
  }
  const response = await openai2.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `You are a healthcare investment analyst. Analyze the deal and provide structured analysis in JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "marketAnalysis": "brief market context",
  "recommendation": "investment recommendation",
  "keyMetrics": [{"name": "metric", "value": "value", "assessment": "good/bad/neutral"}]
}`
      },
      {
        role: "user",
        content: JSON.stringify(dealInfo)
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 500
  });
  return JSON.parse(response.choices[0].message.content || "{}");
}
async function enhanceSearch(query) {
  const openai2 = getOpenAIClient();
  if (!openai2) {
    return { expandedQuery: query, suggestedFilters: [], relatedTerms: [] };
  }
  const response = await openai2.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `Enhance healthcare investment search queries. Return JSON:
{
  "expandedQuery": "expanded search query with medical/investment synonyms",
  "suggestedFilters": ["filter1", "filter2"],
  "relatedTerms": ["term1", "term2"]
}`
      },
      {
        role: "user",
        content: query
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 200
  });
  return JSON.parse(response.choices[0].message.content || "{}");
}
async function getRecommendations(userContext) {
  const openai2 = getOpenAIClient();
  if (!openai2) return [];
  const response = await openai2.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `Generate personalized healthcare investment recommendations. Return JSON array:
[{
  "id": "item_id",
  "type": "deal" | "post" | "user" | "room",
  "score": 0.0-1.0,
  "reason": "why recommended"
}]`
      },
      {
        role: "user",
        content: JSON.stringify(userContext)
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 400
  });
  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result.recommendations || [];
}
async function chatWithAssistant(messages2, userContext) {
  const systemPrompt = `You are MedInvest AI, a helpful assistant for healthcare investing.
${userContext?.specialty ? `User specialty: ${userContext.specialty}` : ""}
${userContext?.investorType ? `Investor type: ${userContext.investorType}` : ""}

Help users with:
- Understanding healthcare investment opportunities
- Explaining medical/biotech concepts
- Navigating the MedInvest platform
- Investment analysis and due diligence

Be professional, accurate, and helpful. If unsure about medical advice, recommend consulting professionals.`;
  const openai2 = getOpenAIClient();
  if (!openai2) {
    return "AI assistant is not available. Please try again later.";
  }
  const response = await openai2.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages2.map((m) => ({ role: m.role, content: m.content }))
    ],
    max_tokens: 500,
    temperature: 0.7
  });
  return response.choices[0].message.content || "I apologize, I could not generate a response.";
}
async function generateEmbedding(text3) {
  const openai2 = getOpenAIClient();
  if (!openai2) return [];
  const response = await openai2.embeddings.create({
    model: "text-embedding-3-small",
    input: text3
  });
  return response.data[0].embedding;
}
var AIService = {
  moderateContent,
  summarizePost,
  analyzeDeal,
  enhanceSearch,
  getRecommendations,
  chatWithAssistant,
  generateEmbedding
};

// server/routes/ai.ts
var router6 = Router6();
router6.post("/chat", async (req, res) => {
  try {
    const { messages: messages2 } = req.body;
    if (!messages2 || !Array.isArray(messages2)) {
      return res.status(400).json({
        success: false,
        error: "Messages array is required"
      });
    }
    const response = await AIService.chatWithAssistant(messages2, {
      specialty: req.body.specialty,
      investorType: req.body.investorType
    });
    res.json({
      success: true,
      data: { message: response }
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate response"
    });
  }
});
router6.post("/moderate", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required"
      });
    }
    const result = await AIService.moderateContent(content);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Moderation error:", error);
    res.status(500).json({
      success: false,
      error: "Moderation failed"
    });
  }
});
router6.post("/summarize", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required"
      });
    }
    const summary = await AIService.summarizePost(content);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error("Summarization error:", error);
    res.status(500).json({
      success: false,
      error: "Summarization failed"
    });
  }
});
router6.post("/analyze-deal", async (req, res) => {
  try {
    const dealInfo = req.body;
    if (!dealInfo.title || !dealInfo.description) {
      return res.status(400).json({
        success: false,
        error: "Deal title and description are required"
      });
    }
    const analysis = await AIService.analyzeDeal(dealInfo);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error("Deal analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Deal analysis failed"
    });
  }
});
router6.post("/enhance-search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required"
      });
    }
    const enhancement = await AIService.enhanceSearch(query);
    res.json({
      success: true,
      data: enhancement
    });
  } catch (error) {
    console.error("Search enhancement error:", error);
    res.status(500).json({
      success: false,
      error: "Search enhancement failed"
    });
  }
});
router6.post("/recommendations", async (req, res) => {
  try {
    const userContext = req.body;
    const recommendations = await AIService.getRecommendations(userContext);
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate recommendations"
    });
  }
});
var ai_default = router6;

// server/routes/posts.ts
import { Router as Router7 } from "express";
var router7 = Router7();
var ROOMS = [
  { id: 1, name: "Cardiology", slug: "cardiology", description: "Heart health and cardiovascular innovations", icon: "heart", color: "#EF4444", posts_count: 1243, members_count: 8521 },
  { id: 2, name: "Oncology", slug: "oncology", description: "Cancer research and treatment advances", icon: "activity", color: "#8B5CF6", posts_count: 987, members_count: 6234 },
  { id: 3, name: "Neurology", slug: "neurology", description: "Brain and nervous system innovations", icon: "cpu", color: "#3B82F6", posts_count: 756, members_count: 5102 },
  { id: 4, name: "Digital Health", slug: "digital-health", description: "Health tech and digital therapeutics", icon: "smartphone", color: "#10B981", posts_count: 1567, members_count: 9876 },
  { id: 5, name: "Biotech", slug: "biotech", description: "Biotechnology breakthroughs", icon: "flask-conical", color: "#F59E0B", posts_count: 892, members_count: 7234 },
  { id: 6, name: "Medical Devices", slug: "medical-devices", description: "Innovative medical equipment", icon: "stethoscope", color: "#06B6D4", posts_count: 654, members_count: 4521 }
];
var generateMockPosts = (count, roomId) => {
  const authors = [
    { id: 1, first_name: "Sarah", last_name: "Chen", full_name: "Dr. Sarah Chen", specialty: "Cardiologist", avatar_url: null, is_verified: true, is_premium: true },
    { id: 2, first_name: "Michael", last_name: "Roberts", full_name: "Dr. Michael Roberts", specialty: "Oncologist", avatar_url: null, is_verified: true, is_premium: false },
    { id: 3, first_name: "Emily", last_name: "Thompson", full_name: "Emily Thompson, RN", specialty: "Nurse Practitioner", avatar_url: null, is_verified: false, is_premium: true },
    { id: 4, first_name: "James", last_name: "Wilson", full_name: "James Wilson, PhD", specialty: "Researcher", avatar_url: null, is_verified: true, is_premium: false }
  ];
  const contents = [
    "Just reviewed the latest clinical trial data for the new CRISPR-based therapy. The results are incredibly promising for treating genetic disorders. This could be a game-changer for patients with rare diseases. #CRISPR #GeneTherapy",
    "Interesting discussion at the conference today about AI-powered diagnostic tools. The accuracy rates are now exceeding human specialists in certain areas. What are your thoughts on AI in healthcare? #DigitalHealth #AI",
    "New FDA approval for the minimally invasive cardiac device shows 40% improvement in patient outcomes. This is exactly the kind of innovation we need to invest in. #CardiacCare #MedTech",
    "The biotech sector is seeing unprecedented growth in personalized medicine. Companies focusing on targeted therapies are showing exceptional promise. #Biotech #PersonalizedMedicine",
    "Great webinar on medical device regulations and the new EU MDR requirements. Compliance is becoming increasingly complex but necessary for patient safety. #MedicalDevices #Regulatory"
  ];
  return Array.from({ length: count }, (_, i) => {
    const author = authors[i % authors.length];
    const room = roomId ? ROOMS.find((r) => r.id === roomId) : ROOMS[i % ROOMS.length];
    return {
      id: i + 1,
      content: contents[i % contents.length],
      author,
      room: room ? { ...room, is_member: true } : null,
      images: [],
      video_url: null,
      is_anonymous: false,
      mentions: [],
      hashtags: contents[i % contents.length].match(/#\w+/g) || [],
      upvotes: Math.floor(Math.random() * 100) + 10,
      downvotes: Math.floor(Math.random() * 10),
      comments_count: Math.floor(Math.random() * 50),
      user_vote: null,
      is_bookmarked: false,
      feed_score: Math.random() * 100,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1e3).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  });
};
router7.get("/feed", optionalAuthMiddleware, async (req, res) => {
  try {
    const { cursor, style = "algorithmic", limit = 20 } = req.query;
    const posts = generateMockPosts(Number(limit));
    res.json({
      posts,
      has_more: true,
      next_cursor: "next_page_token",
      feed_style: style
    });
  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
});
router7.get("/feed/trending", async (req, res) => {
  try {
    const topics = [
      { hashtag: "CRISPR", count: 1234, trend: "up" },
      { hashtag: "DigitalHealth", count: 987, trend: "up" },
      { hashtag: "AI", count: 876, trend: "stable" },
      { hashtag: "Biotech", count: 654, trend: "up" },
      { hashtag: "MedTech", count: 543, trend: "down" }
    ];
    res.json({ topics });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trending topics" });
  }
});
router7.get("/:id", optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const posts = generateMockPosts(1);
    const post = { ...posts[0], id: parseInt(id) };
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});
router7.post("/", authMiddleware, async (req, res) => {
  try {
    const { content, room_id, is_anonymous = false, images = [] } = req.body;
    const userId = req.userId;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }
    const room = ROOMS.find((r) => r.id === room_id);
    const post = {
      id: Date.now(),
      content,
      author: {
        id: userId,
        first_name: "Current",
        last_name: "User",
        full_name: "Current User",
        specialty: "Healthcare Professional",
        avatar_url: null,
        is_verified: false,
        is_premium: false
      },
      room: room ? { ...room, is_member: true } : null,
      images,
      video_url: null,
      is_anonymous,
      mentions: content.match(/@\w+/g) || [],
      hashtags: content.match(/#\w+/g) || [],
      upvotes: 0,
      downvotes: 0,
      comments_count: 0,
      user_vote: null,
      is_bookmarked: false,
      feed_score: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});
router7.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const posts = generateMockPosts(1);
    const post = {
      ...posts[0],
      id: parseInt(id),
      content,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to update post" });
  }
});
router7.delete("/:id", authMiddleware, async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});
router7.post("/:id/vote", authMiddleware, async (req, res) => {
  try {
    const { direction } = req.body;
    res.json({
      upvotes: direction === "up" ? 51 : 50,
      downvotes: direction === "down" ? 6 : 5
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to vote" });
  }
});
router7.delete("/:id/vote", authMiddleware, async (req, res) => {
  try {
    res.json({ upvotes: 50, downvotes: 5 });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove vote" });
  }
});
router7.post("/:id/bookmark", authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, is_bookmarked: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to bookmark" });
  }
});
router7.delete("/:id/bookmark", authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, is_bookmarked: false });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove bookmark" });
  }
});
router7.get("/:postId/comments", async (req, res) => {
  try {
    const comments = [
      {
        id: 1,
        content: "Great insights! The implications for patient care are significant.",
        author: { id: 2, first_name: "John", last_name: "Doe", full_name: "Dr. John Doe", specialty: "Surgeon", avatar_url: null, is_verified: true },
        post_id: parseInt(req.params.postId),
        parent_id: null,
        upvotes: 12,
        downvotes: 0,
        user_vote: null,
        replies_count: 2,
        created_at: new Date(Date.now() - 36e5).toISOString()
      },
      {
        id: 2,
        content: "I agree, this technology could revolutionize how we approach treatment.",
        author: { id: 3, first_name: "Jane", last_name: "Smith", full_name: "Jane Smith, PhD", specialty: "Researcher", avatar_url: null, is_verified: false },
        post_id: parseInt(req.params.postId),
        parent_id: null,
        upvotes: 8,
        downvotes: 1,
        user_vote: null,
        replies_count: 0,
        created_at: new Date(Date.now() - 18e5).toISOString()
      }
    ];
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});
router7.post("/:postId/comments", authMiddleware, async (req, res) => {
  try {
    const { content, parent_id } = req.body;
    const userId = req.userId;
    const comment = {
      id: Date.now(),
      content,
      author: { id: userId, first_name: "Current", last_name: "User", full_name: "Current User", specialty: "Healthcare Professional", avatar_url: null, is_verified: false },
      post_id: parseInt(req.params.postId),
      parent_id: parent_id || null,
      upvotes: 0,
      downvotes: 0,
      user_vote: null,
      replies_count: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});
router7.delete("/:postId/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});
var posts_default = router7;

// server/routes/rooms.ts
import { Router as Router8 } from "express";
var router8 = Router8();
var ROOMS2 = [
  {
    id: 1,
    name: "Cardiology",
    slug: "cardiology",
    description: "Heart health and cardiovascular innovations. Discuss the latest in cardiac care, devices, and treatment methodologies.",
    icon: "heart",
    color: "#EF4444",
    posts_count: 1243,
    members_count: 8521,
    rules: ["Be respectful", "No promotional content", "Cite sources"],
    moderators: [{ id: 1, name: "Dr. Sarah Chen" }]
  },
  {
    id: 2,
    name: "Oncology",
    slug: "oncology",
    description: "Cancer research and treatment advances. Share insights on immunotherapy, targeted treatments, and clinical trials.",
    icon: "activity",
    color: "#8B5CF6",
    posts_count: 987,
    members_count: 6234,
    rules: ["Evidence-based discussion only", "Patient privacy first", "No misinformation"],
    moderators: [{ id: 2, name: "Dr. Michael Roberts" }]
  },
  {
    id: 3,
    name: "Neurology",
    slug: "neurology",
    description: "Brain and nervous system innovations. Explore neurodegenerative diseases, brain-computer interfaces, and neurological research.",
    icon: "cpu",
    color: "#3B82F6",
    posts_count: 756,
    members_count: 5102,
    rules: ["Scientific rigor required", "Respectful debate", "No personal attacks"],
    moderators: [{ id: 3, name: "Dr. Emily Thompson" }]
  },
  {
    id: 4,
    name: "Digital Health",
    slug: "digital-health",
    description: "Health tech and digital therapeutics. Discuss telemedicine, wearables, health apps, and the future of connected healthcare.",
    icon: "smartphone",
    color: "#10B981",
    posts_count: 1567,
    members_count: 9876,
    rules: ["Share insights openly", "Disclose conflicts of interest", "Focus on patient outcomes"],
    moderators: [{ id: 4, name: "James Wilson, PhD" }]
  },
  {
    id: 5,
    name: "Biotech",
    slug: "biotech",
    description: "Biotechnology breakthroughs. Gene therapy, CRISPR, cell therapies, and the cutting edge of biological science.",
    icon: "flask-conical",
    color: "#F59E0B",
    posts_count: 892,
    members_count: 7234,
    rules: ["Technical accuracy matters", "Respect IP boundaries", "Encourage collaboration"],
    moderators: [{ id: 5, name: "Dr. Lisa Park" }]
  },
  {
    id: 6,
    name: "Medical Devices",
    slug: "medical-devices",
    description: "Innovative medical equipment. Discuss regulatory pathways, device development, and breakthrough technologies.",
    icon: "stethoscope",
    color: "#06B6D4",
    posts_count: 654,
    members_count: 4521,
    rules: ["Focus on innovation", "Respect regulatory processes", "Share case studies"],
    moderators: [{ id: 6, name: "Mark Johnson, MBA" }]
  },
  {
    id: 7,
    name: "Pharmaceuticals",
    slug: "pharma",
    description: "Drug development and pharmaceutical innovations. Clinical trials, drug approvals, and market dynamics.",
    icon: "pill",
    color: "#EC4899",
    posts_count: 1123,
    members_count: 8765,
    rules: ["Disclosure required", "Evidence-based claims", "Patient safety first"],
    moderators: [{ id: 7, name: "Dr. Rachel Green" }]
  },
  {
    id: 8,
    name: "Healthcare AI",
    slug: "healthcare-ai",
    description: "Artificial intelligence in medicine. Machine learning diagnostics, predictive analytics, and AI-assisted care.",
    icon: "brain",
    color: "#6366F1",
    posts_count: 876,
    members_count: 5432,
    rules: ["Explain algorithms clearly", "Address bias concerns", "Focus on clinical utility"],
    moderators: [{ id: 8, name: "Alex Kim, PhD" }]
  }
];
var userMemberships = /* @__PURE__ */ new Map();
router8.get("/", optionalAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const userRooms = userMemberships.get(userId) || /* @__PURE__ */ new Set();
    const rooms = ROOMS2.map((room) => ({
      ...room,
      is_member: userRooms.has(room.id)
    }));
    res.json({ rooms });
  } catch (error) {
    console.error("Rooms error:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});
router8.get("/:slug", optionalAuthMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.userId;
    const userRooms = userMemberships.get(userId) || /* @__PURE__ */ new Set();
    const room = ROOMS2.find((r) => r.slug === slug);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json({ ...room, is_member: userRooms.has(room.id) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch room" });
  }
});
router8.post("/:slug/join", authMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.userId;
    const room = ROOMS2.find((r) => r.slug === slug);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    if (!userMemberships.has(userId)) {
      userMemberships.set(userId, /* @__PURE__ */ new Set());
    }
    userMemberships.get(userId).add(room.id);
    res.json({ success: true, is_member: true, members_count: room.members_count + 1 });
  } catch (error) {
    res.status(500).json({ error: "Failed to join room" });
  }
});
router8.delete("/:slug/join", authMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.userId;
    const room = ROOMS2.find((r) => r.slug === slug);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    const userRooms = userMemberships.get(userId);
    if (userRooms) {
      userRooms.delete(room.id);
    }
    res.json({ success: true, is_member: false, members_count: room.members_count });
  } catch (error) {
    res.status(500).json({ error: "Failed to leave room" });
  }
});
router8.get("/:slug/posts", optionalAuthMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    const { cursor, limit = 20 } = req.query;
    const room = ROOMS2.find((r) => r.slug === slug);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    const authors = [
      { id: 1, first_name: "Sarah", last_name: "Chen", full_name: "Dr. Sarah Chen", specialty: "Cardiologist", avatar_url: null, is_verified: true },
      { id: 2, first_name: "Michael", last_name: "Roberts", full_name: "Dr. Michael Roberts", specialty: "Oncologist", avatar_url: null, is_verified: true }
    ];
    const posts = Array.from({ length: Number(limit) }, (_, i) => ({
      id: i + 1,
      content: `Discussion about ${room.name} - Topic ${i + 1}. Great insights on the latest developments in this field. #${room.slug}`,
      author: authors[i % authors.length],
      room: { ...room, is_member: true },
      images: [],
      video_url: null,
      is_anonymous: false,
      mentions: [],
      hashtags: [`#${room.slug}`],
      upvotes: Math.floor(Math.random() * 50) + 5,
      downvotes: Math.floor(Math.random() * 5),
      comments_count: Math.floor(Math.random() * 20),
      user_vote: null,
      is_bookmarked: false,
      feed_score: Math.random() * 100,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1e3).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }));
    res.json({
      posts,
      has_more: true,
      next_cursor: "next_page_token",
      feed_style: "chronological"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch room posts" });
  }
});
var rooms_default = router8;

// server/routes/deals.ts
import { Router as Router9 } from "express";
var router9 = Router9();
var DEALS = [
  {
    id: 1,
    title: "CardioTech Innovations Series B",
    company_name: "CardioTech Innovations",
    description: "Revolutionary AI-powered cardiac monitoring platform that enables real-time detection of arrhythmias and heart conditions. FDA-cleared device with proven clinical outcomes.",
    category: "Medical Devices",
    stage: "Series B",
    target_raise: 15e6,
    raised: 85e5,
    minimum_investment: 5e3,
    maximum_investment: 5e5,
    investors_count: 234,
    valuation: 75e6,
    equity_offered: 20,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
    highlights: [
      "FDA 510(k) cleared",
      "50+ hospital partnerships",
      "$2.1M ARR with 40% MoM growth",
      "Experienced founding team from Medtronic"
    ],
    risks: [
      "Regulatory uncertainty in new markets",
      "Competition from established players",
      "Hardware manufacturing challenges"
    ],
    team: [
      { name: "Dr. Sarah Chen", role: "CEO", background: "Former Medtronic VP" },
      { name: "Michael Roberts", role: "CTO", background: "MIT PhD, 15 patents" }
    ],
    documents: [
      { name: "Pitch Deck", url: "/docs/pitch.pdf" },
      { name: "Financial Model", url: "/docs/financials.xlsx" }
    ],
    status: "active",
    featured: true,
    image_url: null,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1e3).toISOString()
  },
  {
    id: 2,
    title: "GenomeRx Seed Round",
    company_name: "GenomeRx",
    description: "Pioneering personalized medicine through advanced genomic analysis. Our platform enables physicians to prescribe the right medication at the right dose based on genetic profiles.",
    category: "Biotech",
    stage: "Seed",
    target_raise: 5e6,
    raised: 32e5,
    minimum_investment: 2500,
    maximum_investment: 25e4,
    investors_count: 156,
    valuation: 2e7,
    equity_offered: 25,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1e3).toISOString(),
    highlights: [
      "Patented genomic analysis technology",
      "Partnership with 3 major health systems",
      "CLIA-certified laboratory",
      "Published research in Nature Medicine"
    ],
    risks: [
      "Long sales cycle with health systems",
      "Insurance reimbursement challenges",
      "Technology obsolescence risk"
    ],
    team: [
      { name: "Dr. Emily Thompson", role: "CEO", background: "Harvard Medical School faculty" },
      { name: "James Wilson", role: "CSO", background: "Stanford PhD, genomics pioneer" }
    ],
    documents: [
      { name: "Pitch Deck", url: "/docs/pitch.pdf" },
      { name: "Technical Overview", url: "/docs/tech.pdf" }
    ],
    status: "active",
    featured: true,
    image_url: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString()
  },
  {
    id: 3,
    title: "MindWell Digital Therapeutics Pre-Series A",
    company_name: "MindWell Health",
    description: "FDA-authorized digital therapeutic for anxiety and depression. Prescription-based app with proven clinical efficacy and reimbursement pathways.",
    category: "Digital Health",
    stage: "Pre-Series A",
    target_raise: 8e6,
    raised: 21e5,
    minimum_investment: 3e3,
    maximum_investment: 3e5,
    investors_count: 89,
    valuation: 35e6,
    equity_offered: 23,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1e3).toISOString(),
    highlights: [
      "FDA De Novo authorized",
      "CPT codes secured for reimbursement",
      "15,000+ prescriptions written",
      "Clinical outcomes exceed SSRIs"
    ],
    risks: [
      "Patient engagement challenges",
      "Physician adoption barriers",
      "Competition from wellness apps"
    ],
    team: [
      { name: "Dr. Lisa Park", role: "CEO", background: "Psychiatrist, Stanford Health" },
      { name: "Alex Kim", role: "CTO", background: "Ex-Google Health engineer" }
    ],
    documents: [
      { name: "Pitch Deck", url: "/docs/pitch.pdf" },
      { name: "Clinical Study Results", url: "/docs/clinical.pdf" }
    ],
    status: "active",
    featured: false,
    image_url: null,
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1e3).toISOString()
  },
  {
    id: 4,
    title: "NeuraScan AI Series A",
    company_name: "NeuraScan AI",
    description: "AI-powered medical imaging analysis for early detection of neurological conditions. Our algorithms detect Alzheimer's and Parkinson's years before symptoms appear.",
    category: "Healthcare AI",
    stage: "Series A",
    target_raise: 12e6,
    raised: 98e5,
    minimum_investment: 1e4,
    maximum_investment: 1e6,
    investors_count: 178,
    valuation: 6e7,
    equity_offered: 20,
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1e3).toISOString(),
    highlights: [
      "95% accuracy in early detection",
      "Integration with major PACS systems",
      "Published in JAMA Neurology",
      "Contracts with 25 imaging centers"
    ],
    risks: [
      "Regulatory approval timeline",
      "Competition from radiology giants",
      "Data privacy concerns"
    ],
    team: [
      { name: "Dr. Mark Johnson", role: "CEO", background: "Neurologist, Mayo Clinic" },
      { name: "Rachel Green", role: "CTO", background: "DeepMind alumna" }
    ],
    documents: [
      { name: "Pitch Deck", url: "/docs/pitch.pdf" },
      { name: "AI Performance Metrics", url: "/docs/ai-metrics.pdf" }
    ],
    status: "active",
    featured: true,
    image_url: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString()
  }
];
var watchlist = /* @__PURE__ */ new Map();
router9.get("/", optionalAuthMiddleware, async (req, res) => {
  try {
    const { category, stage, sort = "featured", limit = 20 } = req.query;
    const userId = req.userId;
    const userWatchlist = watchlist.get(userId) || /* @__PURE__ */ new Set();
    let deals = [...DEALS];
    if (category) {
      deals = deals.filter((d) => d.category.toLowerCase() === String(category).toLowerCase());
    }
    if (stage) {
      deals = deals.filter((d) => d.stage.toLowerCase() === String(stage).toLowerCase());
    }
    if (sort === "featured") {
      deals.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (sort === "newest") {
      deals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "ending_soon") {
      deals.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }
    const dealsWithWatchlist = deals.map((deal) => ({
      ...deal,
      is_watched: userWatchlist.has(deal.id)
    }));
    res.json({
      deals: dealsWithWatchlist.slice(0, Number(limit)),
      total: deals.length,
      categories: ["Medical Devices", "Biotech", "Digital Health", "Healthcare AI", "Pharmaceuticals"],
      stages: ["Seed", "Pre-Series A", "Series A", "Series B", "Series C+"]
    });
  } catch (error) {
    console.error("Deals error:", error);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});
router9.get("/featured", async (req, res) => {
  try {
    const featured = DEALS.filter((d) => d.featured);
    res.json({ deals: featured });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch featured deals" });
  }
});
router9.get("/:id", optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userWatchlist = watchlist.get(userId) || /* @__PURE__ */ new Set();
    const deal = DEALS.find((d) => d.id === parseInt(id));
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    res.json({ ...deal, is_watched: userWatchlist.has(deal.id) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch deal" });
  }
});
router9.post("/:id/watch", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!watchlist.has(userId)) {
      watchlist.set(userId, /* @__PURE__ */ new Set());
    }
    watchlist.get(userId).add(parseInt(id));
    res.json({ success: true, is_watched: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to watch deal" });
  }
});
router9.delete("/:id/watch", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userWatchlist = watchlist.get(userId);
    if (userWatchlist) {
      userWatchlist.delete(parseInt(id));
    }
    res.json({ success: true, is_watched: false });
  } catch (error) {
    res.status(500).json({ error: "Failed to unwatch deal" });
  }
});
router9.post("/:id/interest", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, message } = req.body;
    res.json({
      success: true,
      message: "Your interest has been recorded. Our team will contact you within 24 hours."
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to express interest" });
  }
});
var deals_default = router9;

// server/routes/notifications.ts
import { Router as Router10 } from "express";
var router10 = Router10();
var generateNotifications = (count) => {
  const types = [
    { type: "like", title: "New Like", body: "Dr. Sarah Chen liked your post about CRISPR therapy", data: { post_id: 1, user_id: 1 } },
    { type: "comment", title: "New Comment", body: "Michael Roberts commented on your post", data: { post_id: 1, user_id: 2 } },
    { type: "follow", title: "New Follower", body: "Dr. Emily Thompson started following you", data: { user_id: 3 } },
    { type: "mention", title: "Mention", body: "James Wilson mentioned you in a post", data: { post_id: 2, user_id: 4 } },
    { type: "deal_update", title: "Deal Update", body: "CardioTech Innovations has reached 80% of funding goal", data: { deal_id: 1 } },
    { type: "investment_update", title: "Investment Update", body: "Your investment in GenomeRx has increased by 12%", data: { deal_id: 2 } },
    { type: "ama_live", title: "AMA Starting", body: "Dr. Lisa Park's AMA on Digital Therapeutics is starting now", data: { ama_id: 1 } },
    { type: "achievement", title: "Achievement Unlocked", body: 'You earned the "Early Investor" badge!', data: { achievement_id: 1 } },
    { type: "friend_request", title: "Friend Request", body: "Dr. Mark Johnson wants to connect", data: { user_id: 5 } },
    { type: "course_update", title: "New Lesson Available", body: 'A new lesson is available in "Healthcare Investment Fundamentals"', data: { course_id: 1 } },
    { type: "event_reminder", title: "Event Reminder", body: "MedTech Innovation Summit starts in 1 hour", data: { event_id: 1 } },
    { type: "system", title: "Account Update", body: "Your account verification is complete", data: {} }
  ];
  return Array.from({ length: count }, (_, i) => {
    const notifType = types[i % types.length];
    return {
      id: i + 1,
      type: notifType.type,
      title: notifType.title,
      body: notifType.body,
      is_read: i > 3,
      data: notifType.data,
      created_at: new Date(Date.now() - i * 36e5).toISOString()
    };
  });
};
var notifications2 = generateNotifications(20);
router10.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const paged = notifications2.slice(start, end);
    const unreadCount = notifications2.filter((n) => !n.is_read).length;
    res.json({
      notifications: paged,
      unread_count: unreadCount,
      total: notifications2.length,
      has_more: end < notifications2.length
    });
  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});
router10.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const count = notifications2.filter((n) => !n.is_read).length;
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Failed to get unread count" });
  }
});
router10.post("/:id/read", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = notifications2.find((n) => n.id === parseInt(id));
    if (notification) {
      notification.is_read = true;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});
router10.post("/read-all", authMiddleware, async (req, res) => {
  try {
    notifications2.forEach((n) => n.is_read = true);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});
router10.get("/preferences", authMiddleware, async (req, res) => {
  try {
    res.json({
      push_enabled: true,
      email_enabled: true,
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      messages: true,
      deals: true,
      amas: true
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get preferences" });
  }
});
router10.put("/preferences", authMiddleware, async (req, res) => {
  try {
    const preferences = req.body;
    res.json({ success: true, ...preferences });
  } catch (error) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
});
router10.post("/push-token", authMiddleware, async (req, res) => {
  try {
    const { token, platform, deviceId } = req.body;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to register push token" });
  }
});
router10.delete("/push-token/:token", authMiddleware, async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to unregister push token" });
  }
});
var notifications_default = router10;

// server/routes/messages.ts
import { Router as Router11 } from "express";
import { eq as eq8, or as or4, and as and7, desc as desc5 } from "drizzle-orm";
import { sql as sql6 } from "drizzle-orm";
var router11 = Router11();
router11.use(authMiddleware);
function formatUserForResponse(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName || "",
    last_name: user.lastName || "",
    full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
    avatar_url: user.avatarUrl,
    is_verified: user.isVerified
  };
}
router11.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations2 = await db.select().from(dmConversations).where(or4(eq8(dmConversations.user1Id, userId), eq8(dmConversations.user2Id, userId))).orderBy(desc5(dmConversations.lastMessageAt));
    const formattedConversations = await Promise.all(
      conversations2.map(async (conv) => {
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const unreadCount = conv.user1Id === userId ? conv.user1Unread : conv.user2Unread;
        const isMuted = conv.user1Id === userId ? conv.user1Muted : conv.user2Muted;
        const [otherUser] = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
          isVerified: users.isVerified
        }).from(users).where(eq8(users.id, otherUserId)).limit(1);
        if (!otherUser) return null;
        return {
          id: conv.id,
          other_user: formatUserForResponse(otherUser),
          last_message: conv.lastMessage,
          last_message_at: conv.lastMessageAt?.toISOString(),
          unread_count: unreadCount,
          is_muted: isMuted
        };
      })
    );
    res.json({ conversations: formattedConversations.filter(Boolean) });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});
router11.get("/unread-count", async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations2 = await db.select({
      user1Id: dmConversations.user1Id,
      user1Unread: dmConversations.user1Unread,
      user2Unread: dmConversations.user2Unread
    }).from(dmConversations).where(or4(eq8(dmConversations.user1Id, userId), eq8(dmConversations.user2Id, userId)));
    let totalUnread = 0;
    for (const conv of conversations2) {
      totalUnread += conv.user1Id === userId ? conv.user1Unread : conv.user2Unread;
    }
    res.json({ count: totalUnread });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});
router11.get("/:userId", async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    const [otherUser] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified
    }).from(users).where(eq8(users.id, otherUserId)).limit(1);
    if (!otherUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    let [conversation] = await db.select().from(dmConversations).where(
      or4(
        and7(eq8(dmConversations.user1Id, currentUserId), eq8(dmConversations.user2Id, otherUserId)),
        and7(eq8(dmConversations.user1Id, otherUserId), eq8(dmConversations.user2Id, currentUserId))
      )
    ).limit(1);
    let messages2 = [];
    if (conversation) {
      const rawMessages = await db.select({
        id: directMessages.id,
        conversationId: directMessages.conversationId,
        content: directMessages.content,
        senderId: directMessages.senderId,
        isRead: directMessages.isRead,
        readAt: directMessages.readAt,
        createdAt: directMessages.createdAt
      }).from(directMessages).where(eq8(directMessages.conversationId, conversation.id)).orderBy(directMessages.createdAt);
      messages2 = await Promise.all(
        rawMessages.map(async (msg) => {
          const [sender] = await db.select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            avatarUrl: users.avatarUrl,
            isVerified: users.isVerified
          }).from(users).where(eq8(users.id, msg.senderId)).limit(1);
          return {
            id: msg.id,
            conversation_id: msg.conversationId,
            content: msg.content,
            sender: sender ? formatUserForResponse(sender) : null,
            is_read: msg.isRead,
            read_at: msg.readAt?.toISOString(),
            created_at: msg.createdAt.toISOString()
          };
        })
      );
      const isUser1 = conversation.user1Id === currentUserId;
      if (isUser1 && conversation.user1Unread > 0) {
        await db.update(dmConversations).set({ user1Unread: 0, updatedAt: /* @__PURE__ */ new Date() }).where(eq8(dmConversations.id, conversation.id));
      } else if (!isUser1 && conversation.user2Unread > 0) {
        await db.update(dmConversations).set({ user2Unread: 0, updatedAt: /* @__PURE__ */ new Date() }).where(eq8(dmConversations.id, conversation.id));
      }
      await db.update(directMessages).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(
        and7(
          eq8(directMessages.conversationId, conversation.id),
          eq8(directMessages.senderId, otherUserId),
          eq8(directMessages.isRead, false)
        )
      );
    }
    res.json({
      messages: messages2,
      other_user: formatUserForResponse(otherUser)
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
});
router11.post("/:userId", async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      res.status(400).json({ message: "Message content is required" });
      return;
    }
    const [otherUser] = await db.select({ id: users.id }).from(users).where(eq8(users.id, otherUserId)).limit(1);
    if (!otherUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    let [conversation] = await db.select().from(dmConversations).where(
      or4(
        and7(eq8(dmConversations.user1Id, currentUserId), eq8(dmConversations.user2Id, otherUserId)),
        and7(eq8(dmConversations.user1Id, otherUserId), eq8(dmConversations.user2Id, currentUserId))
      )
    ).limit(1);
    if (!conversation) {
      const [newConv] = await db.insert(dmConversations).values({
        user1Id: currentUserId,
        user2Id: otherUserId
      }).returning();
      conversation = newConv;
    }
    const [message] = await db.insert(directMessages).values({
      conversationId: conversation.id,
      senderId: currentUserId,
      content: content.trim()
    }).returning();
    const isUser1 = conversation.user1Id === currentUserId;
    await db.update(dmConversations).set({
      lastMessage: content.trim().substring(0, 100),
      lastMessageAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      ...isUser1 ? { user2Unread: sql6`user2_unread + 1` } : { user1Unread: sql6`user1_unread + 1` }
    }).where(eq8(dmConversations.id, conversation.id));
    const [sender] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified
    }).from(users).where(eq8(users.id, currentUserId)).limit(1);
    res.status(201).json({
      id: message.id,
      conversation_id: message.conversationId,
      content: message.content,
      sender: sender ? formatUserForResponse(sender) : null,
      is_read: message.isRead,
      created_at: message.createdAt.toISOString()
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});
router11.delete("/:userId", async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    const [conversation] = await db.select().from(dmConversations).where(
      or4(
        and7(eq8(dmConversations.user1Id, currentUserId), eq8(dmConversations.user2Id, otherUserId)),
        and7(eq8(dmConversations.user1Id, otherUserId), eq8(dmConversations.user2Id, currentUserId))
      )
    ).limit(1);
    if (conversation) {
      await db.delete(dmConversations).where(eq8(dmConversations.id, conversation.id));
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
});
var messages_default = router11;

// server/routes.ts
async function registerRoutes(app2) {
  registerChatRoutes(app2);
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.use("/api/auth", auth_default);
  app2.use("/api/investments", investments_default);
  app2.use("/api/portfolio", portfolio_default);
  app2.use("/api/articles", articles_default);
  app2.use("/api/users", users_default);
  app2.use("/api/ai", ai_default);
  app2.use("/api/posts", posts_default);
  app2.use("/api/rooms", rooms_default);
  app2.use("/api/deals", deals_default);
  app2.use("/api/notifications", notifications_default);
  app2.use("/api/messages", messages_default);
  app2.get("/api/feed", (req, res, next) => {
    req.url = "/feed";
    posts_default(req, res, next);
  });
  app2.get("/api/feed/trending", (req, res, next) => {
    req.url = "/feed/trending";
    posts_default(req, res, next);
  });
  app2.get("/api/oauth-debug", (req, res) => {
    const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
    const forwardedHost = req.header("x-forwarded-host") || req.get("host");
    const currentOrigin = `${forwardedProto}://${forwardedHost}`;
    const callbackUri = `${currentOrigin}/api/auth/callback`;
    const devDomain = process.env.REPLIT_DEV_DOMAIN;
    const pubDomains = process.env.REPLIT_DOMAINS;
    const uris = [callbackUri];
    if (devDomain) uris.push(`https://${devDomain}/api/auth/callback`);
    if (pubDomains) {
      for (const d of pubDomains.split(",")) {
        const u = `https://${d.trim()}/api/auth/callback`;
        if (!uris.includes(u)) uris.push(u);
      }
    }
    for (const d of ["themedicineandmoneyshow.com", "medinvest-mobile--rsmolarz.replit.app"]) {
      const u = `https://${d}/api/auth/callback`;
      if (!uris.includes(u)) uris.push(u);
    }
    const origins = [...new Set(uris.map((u) => u.replace("/api/auth/callback", "")))];
    res.send(`<!DOCTYPE html><html><head><title>OAuth Debug</title>
    <style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:20px;background:#1a1a2e;color:#e0e0e0}
    h1{color:#00a86b}h2{color:#0066cc;margin-top:20px}code{background:#2d2d44;padding:4px 8px;border-radius:4px;display:block;margin:5px 0;word-break:break-all;font-size:14px}
    .s{background:#2d2d44;padding:15px;border-radius:8px;margin:10px 0}
    .ok{color:#00a86b}.miss{color:#cc4444}</style></head>
    <body><h1>OAuth Redirect URI Setup Guide</h1>
    <div class="s"><h2>Step 1: Copy These Redirect URIs</h2>
    <p>Add ALL of these to each OAuth provider:</p>
    ${uris.map((u) => `<code>${u}</code>`).join("")}</div>
    <div class="s"><h2>Step 2: Google Cloud Console</h2>
    <p><a href="https://console.cloud.google.com/apis/credentials" style="color:#00a86b">Open Google Cloud Console</a></p>
    <p><b>Authorized JavaScript Origins:</b></p>
    ${origins.map((u) => `<code>${u}</code>`).join("")}
    <p><b>Authorized Redirect URIs:</b></p>
    ${uris.map((u) => `<code>${u}</code>`).join("")}
    <p><b>IMPORTANT:</b> OAuth consent screen must be "External" type. If in "Testing" mode, add your Google email as a test user.</p></div>
    <div class="s"><h2>Step 3: GitHub Developer Settings</h2>
    <p><a href="https://github.com/settings/developers" style="color:#00a86b">Open GitHub Developer Settings</a></p>
    <p><b>Authorization callback URL:</b> (only supports ONE)</p>
    <code>${callbackUri}</code></div>
    <div class="s"><h2>Step 4: Facebook Developers</h2>
    <p><a href="https://developers.facebook.com" style="color:#00a86b">Open Facebook Developers</a> \u2192 Your App \u2192 Use Cases \u2192 Facebook Login \u2192 Customize \u2192 Settings</p>
    <p><b>Valid OAuth Redirect URIs:</b></p>
    ${uris.map((u) => `<code>${u}</code>`).join("")}</div>
    <div class="s"><h2>Provider Credentials Status</h2>
    <p>Google: <span class="${process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? "ok" : "miss"}">${process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? "Configured" : "Missing"}</span></p>
    <p>GitHub: <span class="${process.env.GITHUB_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ? "ok" : "miss"}">${process.env.GITHUB_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ? "Configured" : "Missing"}</span></p>
    <p>Facebook: <span class="${process.env.FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ? "ok" : "miss"}">${process.env.FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ? "Configured" : "Missing"}</span></p></div>
    </body></html>`);
  });
  app2.use("/api/*", (req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs2 from "fs";
import * as path2 from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}:5000`);
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}:8081`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        const domain = d.trim();
        origins.add(`https://${domain}`);
        origins.add(`https://${domain}:5000`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    const isReplitDev = origin?.includes(".picard.replit.dev") || origin?.includes(".repl.co") || origin?.includes(".replit.app") || origin?.includes(".replit.dev");
    if (origin && (origins.has(origin) || isLocalhost || isReplitDev)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, expo-platform");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path3.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path2.resolve(process.cwd(), "app.json");
    const appJsonContent = fs2.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, req, res) {
  const manifestPath = path2.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs2.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  let manifest = fs2.readFileSync(manifestPath, "utf-8");
  const forwardedHost = req.header("x-forwarded-host");
  const requestHost = forwardedHost || req.get("host") || "";
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const requestBaseUrl = `${protocol}://${requestHost}`;
  const urlPattern = /https?:\/\/[^"\/\s]+/g;
  const parsed = JSON.parse(manifest);
  if (parsed.launchAsset?.url) {
    parsed.launchAsset.url = parsed.launchAsset.url.replace(urlPattern, requestBaseUrl);
  }
  if (parsed.extra?.expoClient?.hostUri) {
    parsed.extra.expoClient.hostUri = requestHost + "/" + platform;
  }
  if (parsed.extra?.expoGo?.debuggerHost) {
    parsed.extra.expoGo.debuggerHost = requestHost + "/" + platform;
  }
  if (parsed.assets) {
    for (const asset of parsed.assets) {
      if (asset.url) {
        asset.url = asset.url.replace(urlPattern, requestBaseUrl);
      }
    }
  }
  res.send(JSON.stringify(parsed));
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path2.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs2.readFileSync(templatePath, "utf-8");
  const privacyPath = path2.resolve(process.cwd(), "server", "templates", "privacy.html");
  const termsPath = path2.resolve(process.cwd(), "server", "templates", "terms.html");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.get("/privacy", (_req, res) => {
    res.sendFile(privacyPath);
  });
  app2.get("/terms", (_req, res) => {
    res.sendFile(termsPath);
  });
  app2.get("/manifest/ios", (req, res) => {
    return serveExpoManifest("ios", req, res);
  });
  app2.get("/manifest/android", (req, res) => {
    return serveExpoManifest("android", req, res);
  });
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, req, res);
    }
    if (req.path === "/" && req.query.code && req.query.state) {
      log(`OAuth callback detected at root, internally forwarding to /api/auth/callback`);
      const qs = new URLSearchParams(req.query).toString();
      req.url = `/api/auth/callback?${qs}`;
      return next();
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path2.resolve(process.cwd(), "assets")));
  app2.use("/uploads", express.static(path2.resolve(process.cwd(), "uploads")));
  app2.use(express.static(path2.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
