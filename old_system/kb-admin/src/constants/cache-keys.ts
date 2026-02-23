/**
 * This file contains cache keys used for SWR data fetching
 * These keys can be safely imported by both client and server components
 */

// Cache key for customers data
export const CUSTOMERS_CACHE_KEY = "customers";

// Cache key for licenses data
export const LICENSES_CACHE_KEY = "licenses";

// Cache key for knowledge base files
export const KNOWLEDGE_BASE_LITE_CACHE_KEY = "knowledge-base-files-lite";

// Cache key for knowledge base files status
export const KNOWLEDGE_BASE_ALL_STATUS_CACHE_KEY =
  "knowledge-base-files-all-status";

// Cache key for news data
export const NEWS_CACHE_KEY = "news";

// Cache key for courses data
export const COURSES_CACHE_KEY = "courses";

// Cache key for entity names used in breadcrumbs
export const ENTITY_NAME_CACHE_KEY = (type: string, id: string) =>
  `entity-name-${type}-${id}`;

// Cache key for knowledge base invocations data
export const KNOWLEDGE_BASE_INVOCATIONS_CACHE_KEY =
  "knowledge-base-invocations";

// Cache key for lena profiles data
export const LENA_PROFILES_CACHE_KEY = "lena-profiles";

// Cache key for token usage data
export const TOKEN_USAGE_CACHE_KEY = "token-usage";

// Default password for new users
export const DEFAULT_USER_PASSWORD = "12345678";
