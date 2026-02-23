import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export type UserRole = "admin" | "user";

const statement = {
  ...defaultStatements,
  admin: ["create", "read", "update", "delete"],
  user: ["create", "delete", "list"],
  customer: ["create", "read", "update", "delete"],
  regular: ["create", "read", "update", "delete"],
  knowledgebase: ["create", "read", "update", "delete"],
  news: ["create", "read", "update", "delete"],
  lenaProfile: ["create", "read", "update", "delete"],
  educations: ["create", "read", "update", "delete"],
  licenses: ["create", "read", "update", "delete"],
  lenaAnalytics: ["create", "read", "update", "delete"],
  pages: [
    "admin",
    "customers",
    "knowledgebase",
    "users",
    "news",
    "lena-analytics",
    "manage-lena",
    "educations",
  ],
} as const;

const ac = createAccessControl(statement);

const admin = ac.newRole({
  ...adminAc.statements,
  admin: ["create", "read", "update", "delete"],
  user: ["create", "delete", "list"],
  customer: ["create", "read", "update", "delete"],
  regular: ["create", "read", "update", "delete"],
  knowledgebase: ["create", "read", "update", "delete"],
  news: ["create", "read", "update", "delete"],
  lenaProfile: ["create", "read", "update", "delete"],
  educations: ["create", "read", "update", "delete"],
  licenses: ["create", "read", "update", "delete"],
  lenaAnalytics: ["create", "read", "update", "delete"],
  pages: [
    "admin",
    "customers",
    "knowledgebase",
    "users",
    "news",
    "lena-analytics",
    "manage-lena",
    "educations",
  ],
});

export { admin, ac };
