import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection string from environment
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle database instance with schema
export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from './schema';

// Export type for database instance
export type Database = typeof db;
