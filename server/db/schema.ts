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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// Enums
// ============================================

export const authProviderEnum = pgEnum('auth_provider', ['apple', 'google', 'email']);

export const investmentCategoryEnum = pgEnum('investment_category', [
  'Biotech',
  'Medical Devices',
  'Digital Health',
  'Pharmaceuticals',
  'Research',
  'Healthcare Services',
]);

export const riskLevelEnum = pgEnum('risk_level', ['Low', 'Medium', 'High']);

export const investmentStatusEnum = pgEnum('investment_status', [
  'active',
  'funded',
  'closed',
  'cancelled',
]);

export const portfolioStatusEnum = pgEnum('portfolio_status', [
  'active',
  'completed',
  'pending',
  'cancelled',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'investment',
  'dividend',
  'withdrawal',
  'refund',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
]);

export const articleCategoryEnum = pgEnum('article_category', [
  'AI & Healthcare',
  'Biotech',
  'Medical Devices',
  'Digital Health',
  'Market Trends',
  'Regulations',
  'Research',
]);

export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['bank', 'card']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'investment_update',
  'portfolio_milestone',
  'new_opportunity',
  'article',
  'system',
]);

// ============================================
// Users Table
// ============================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    avatarUrl: text('avatar_url'),
    provider: authProviderEnum('provider').notNull().default('email'),
    providerUserId: varchar('provider_user_id', { length: 255 }),
    passwordHash: text('password_hash'),
    isVerified: boolean('is_verified').notNull().default(false),
    isAccredited: boolean('is_accredited').notNull().default(false),
    emailVerifiedAt: timestamp('email_verified_at'),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    providerIdx: index('users_provider_idx').on(table.provider, table.providerUserId),
  })
);

// ============================================
// User Sessions Table
// ============================================

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    tokenIdx: uniqueIndex('sessions_token_idx').on(table.token),
  })
);

// ============================================
// Password Reset Tokens Table
// ============================================

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('password_reset_token_idx').on(table.token),
    userIdIdx: index('password_reset_user_id_idx').on(table.userId),
  })
);

// ============================================
// Push Tokens Table
// ============================================

export const pushTokens = pgTable(
  'push_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: varchar('platform', { length: 10 }), // ios, android
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('push_tokens_user_id_idx').on(table.userId),
    tokenIdx: uniqueIndex('push_tokens_token_idx').on(table.token),
  })
);

// ============================================
// Notification Preferences Table
// ============================================

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  investmentUpdates: boolean('investment_updates').notNull().default(true),
  newOpportunities: boolean('new_opportunities').notNull().default(true),
  portfolioMilestones: boolean('portfolio_milestones').notNull().default(true),
  articles: boolean('articles').notNull().default(false),
  marketing: boolean('marketing').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// Investments Table
// ============================================

export const investments = pgTable(
  'investments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    longDescription: text('long_description'),
    category: investmentCategoryEnum('category').notNull(),
    fundingGoal: decimal('funding_goal', { precision: 15, scale: 2 }).notNull(),
    fundingCurrent: decimal('funding_current', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    minimumInvestment: decimal('minimum_investment', { precision: 15, scale: 2 })
      .notNull()
      .default('1000'),
    expectedRoiMin: decimal('expected_roi_min', { precision: 5, scale: 2 }),
    expectedRoiMax: decimal('expected_roi_max', { precision: 5, scale: 2 }),
    riskLevel: riskLevelEnum('risk_level').notNull().default('Medium'),
    status: investmentStatusEnum('status').notNull().default('active'),
    imageUrl: text('image_url'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    investorCount: integer('investor_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index('investments_status_idx').on(table.status),
    categoryIdx: index('investments_category_idx').on(table.category),
    endDateIdx: index('investments_end_date_idx').on(table.endDate),
  })
);

// ============================================
// Investment Documents Table
// ============================================

export const investmentDocuments = pgTable(
  'investment_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    investmentId: uuid('investment_id')
      .notNull()
      .references(() => investments.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // pdf, xlsx, etc.
    url: text('url').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    investmentIdIdx: index('inv_docs_investment_id_idx').on(table.investmentId),
  })
);

// ============================================
// Investment Team Members Table
// ============================================

export const investmentTeamMembers = pgTable(
  'investment_team_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    investmentId: uuid('investment_id')
      .notNull()
      .references(() => investments.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    linkedInUrl: text('linkedin_url'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    investmentIdIdx: index('inv_team_investment_id_idx').on(table.investmentId),
  })
);

// ============================================
// Investment Milestones Table
// ============================================

export const investmentMilestones = pgTable(
  'investment_milestones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    investmentId: uuid('investment_id')
      .notNull()
      .references(() => investments.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    targetDate: timestamp('target_date'),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    investmentIdIdx: index('inv_milestones_investment_id_idx').on(table.investmentId),
  })
);

// ============================================
// Portfolio (User Investments) Table
// ============================================

export const portfolioInvestments = pgTable(
  'portfolio_investments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    investmentId: uuid('investment_id')
      .notNull()
      .references(() => investments.id, { onDelete: 'restrict' }),
    amountInvested: decimal('amount_invested', { precision: 15, scale: 2 }).notNull(),
    currentValue: decimal('current_value', { precision: 15, scale: 2 }).notNull(),
    shares: decimal('shares', { precision: 15, scale: 6 }),
    status: portfolioStatusEnum('status').notNull().default('pending'),
    investedAt: timestamp('invested_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('portfolio_user_id_idx').on(table.userId),
    investmentIdIdx: index('portfolio_investment_id_idx').on(table.investmentId),
    userInvestmentIdx: uniqueIndex('portfolio_user_investment_idx').on(
      table.userId,
      table.investmentId
    ),
  })
);

// ============================================
// Transactions Table
// ============================================

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    portfolioInvestmentId: uuid('portfolio_investment_id').references(
      () => portfolioInvestments.id,
      { onDelete: 'set null' }
    ),
    type: transactionTypeEnum('type').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    status: transactionStatusEnum('status').notNull().default('pending'),
    paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
    reference: varchar('reference', { length: 255 }),
    metadata: text('metadata'), // JSON string for additional data
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    userIdIdx: index('transactions_user_id_idx').on(table.userId),
    statusIdx: index('transactions_status_idx').on(table.status),
    createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
  })
);

// ============================================
// Payment Methods Table
// ============================================

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: paymentMethodTypeEnum('type').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    last4: varchar('last4', { length: 4 }).notNull(),
    expiryMonth: integer('expiry_month'),
    expiryYear: integer('expiry_year'),
    bankName: varchar('bank_name', { length: 255 }),
    isDefault: boolean('is_default').notNull().default(false),
    stripePaymentMethodId: varchar('stripe_payment_method_id', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('payment_methods_user_id_idx').on(table.userId),
  })
);

// ============================================
// Articles Table
// ============================================

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 500 }).notNull(),
    summary: text('summary').notNull(),
    content: text('content'),
    source: varchar('source', { length: 255 }).notNull(),
    sourceUrl: text('source_url'),
    author: varchar('author', { length: 255 }),
    imageUrl: text('image_url'),
    category: articleCategoryEnum('category').notNull(),
    tags: text('tags'), // JSON array as string
    readTime: integer('read_time').notNull().default(5),
    isFeatured: boolean('is_featured').notNull().default(false),
    viewCount: integer('view_count').notNull().default(0),
    publishedAt: timestamp('published_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('articles_category_idx').on(table.category),
    publishedAtIdx: index('articles_published_at_idx').on(table.publishedAt),
    featuredIdx: index('articles_featured_idx').on(table.isFeatured),
  })
);

// ============================================
// Article Bookmarks Table
// ============================================

export const articleBookmarks = pgTable(
  'article_bookmarks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('bookmarks_user_id_idx').on(table.userId),
    userArticleIdx: uniqueIndex('bookmarks_user_article_idx').on(
      table.userId,
      table.articleId
    ),
  })
);

// ============================================
// Notifications Table
// ============================================

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body').notNull(),
    data: text('data'), // JSON string
    read: boolean('read').notNull().default(false),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    readIdx: index('notifications_read_idx').on(table.userId, table.read),
  })
);

// ============================================
// Direct Messages Tables
// ============================================

export const dmConversations = pgTable(
  'dm_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user1Id: uuid('user1_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    user2Id: uuid('user2_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lastMessageAt: timestamp('last_message_at'),
    lastMessage: text('last_message'),
    user1Unread: integer('user1_unread').notNull().default(0),
    user2Unread: integer('user2_unread').notNull().default(0),
    user1Muted: boolean('user1_muted').notNull().default(false),
    user2Muted: boolean('user2_muted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    user1Idx: index('dm_conv_user1_idx').on(table.user1Id),
    user2Idx: index('dm_conv_user2_idx').on(table.user2Id),
    usersIdx: uniqueIndex('dm_conv_users_idx').on(table.user1Id, table.user2Id),
  })
);

export const directMessages = pgTable(
  'direct_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => dmConversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    conversationIdx: index('dm_conversation_idx').on(table.conversationId),
    senderIdx: index('dm_sender_idx').on(table.senderId),
    createdAtIdx: index('dm_created_at_idx').on(table.createdAt),
  })
);

// ============================================
// Relations
// ============================================

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(userSessions),
  pushTokens: many(pushTokens),
  notificationPreferences: one(notificationPreferences),
  portfolioInvestments: many(portfolioInvestments),
  transactions: many(transactions),
  paymentMethods: many(paymentMethods),
  bookmarks: many(articleBookmarks),
  notifications: many(notifications),
  dmConversationsAsUser1: many(dmConversations, { relationName: 'user1' }),
  dmConversationsAsUser2: many(dmConversations, { relationName: 'user2' }),
  sentMessages: many(directMessages),
}));

export const dmConversationsRelations = relations(dmConversations, ({ one, many }) => ({
  user1: one(users, {
    fields: [dmConversations.user1Id],
    references: [users.id],
    relationName: 'user1',
  }),
  user2: one(users, {
    fields: [dmConversations.user2Id],
    references: [users.id],
    relationName: 'user2',
  }),
  messages: many(directMessages),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  conversation: one(dmConversations, {
    fields: [directMessages.conversationId],
    references: [dmConversations.id],
  }),
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
  }),
}));

export const investmentsRelations = relations(investments, ({ many }) => ({
  documents: many(investmentDocuments),
  teamMembers: many(investmentTeamMembers),
  milestones: many(investmentMilestones),
  portfolioInvestments: many(portfolioInvestments),
}));

export const investmentDocumentsRelations = relations(investmentDocuments, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentDocuments.investmentId],
    references: [investments.id],
  }),
}));

export const investmentTeamMembersRelations = relations(investmentTeamMembers, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentTeamMembers.investmentId],
    references: [investments.id],
  }),
}));

export const investmentMilestonesRelations = relations(investmentMilestones, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentMilestones.investmentId],
    references: [investments.id],
  }),
}));

export const portfolioInvestmentsRelations = relations(portfolioInvestments, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolioInvestments.userId],
    references: [users.id],
  }),
  investment: one(investments, {
    fields: [portfolioInvestments.investmentId],
    references: [investments.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  portfolioInvestment: one(portfolioInvestments, {
    fields: [transactions.portfolioInvestmentId],
    references: [portfolioInvestments.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [transactions.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const articlesRelations = relations(articles, ({ many }) => ({
  bookmarks: many(articleBookmarks),
}));

export const articleBookmarksRelations = relations(articleBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [articleBookmarks.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [articleBookmarks.articleId],
    references: [articles.id],
  }),
}));
