import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

export type UserRole = 'admin' | 'owner' | 'manager' | 'customer' | 'user';

const statement = {
  ...defaultStatements,
  owner: ['create', 'read', 'update', 'delete'],
  manager: ['create', 'read', 'update', 'delete'],
  customer: ['create', 'read', 'update', 'delete'],
  regular: ['create', 'read', 'update', 'delete'],
  knowledgebase: ['create', 'read', 'update', 'delete'],
  news: ['create', 'read', 'update', 'delete'],
  pages: ['admin', 'customers', 'knowledgebase', 'users', 'notifications', 'news'],
} as const;

const ac = createAccessControl(statement);

const admin = ac.newRole({
  owner: ['create', 'read', 'update', 'delete'],
  manager: ['create', 'read', 'update', 'delete'],
  customer: ['create', 'read', 'update', 'delete'],
  regular: ['create', 'read', 'update', 'delete'],
  knowledgebase: ['create', 'read', 'update', 'delete'],
  news: ['create', 'read', 'update', 'delete'],
  pages: ['admin', 'customers', 'knowledgebase', 'users', 'notifications', 'news'],
  ...adminAc.statements,
});

const owner = ac.newRole({
  owner: ['create', 'read', 'update', 'delete'],
  manager: ['create', 'read', 'update', 'delete'],
  customer: ['create', 'read', 'update', 'delete'],
  regular: ['create', 'read', 'update', 'delete'],
  knowledgebase: ['create', 'read', 'update', 'delete'],
  news: ['create', 'read', 'update', 'delete'],
  pages: ['admin', 'customers', 'knowledgebase', 'users', 'notifications', 'news'],
  ...adminAc.statements,
});

const manager = ac.newRole({
  customer: ['create', 'read', 'update', 'delete'],
  regular: ['create', 'read', 'update', 'delete'],
  knowledgebase: ['create', 'read', 'update', 'delete'],
  news: ['create', 'read', 'update', 'delete'],
  pages: ['customers', 'knowledgebase', 'users', 'notifications', 'news'],
});

const customer = ac.newRole({
  regular: ['create', 'read', 'update', 'delete'],
  news: ['read'],
  pages: ['users'],
});

export { owner, admin, ac, manager, customer };
