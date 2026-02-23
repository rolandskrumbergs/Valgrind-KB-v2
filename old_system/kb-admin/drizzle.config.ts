import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set in drizzle.config.ts");
}

export default defineConfig({
	out: "./src/db/drizzle",
	schema: "./src/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: DATABASE_URL,
	},
});
