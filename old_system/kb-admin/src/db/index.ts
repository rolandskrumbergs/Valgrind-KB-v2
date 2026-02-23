import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Get DATABASE_URL from environment variables
const DATABASE_URL = process.env.DATABASE_URL || "";

// Create the database connection
const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });
