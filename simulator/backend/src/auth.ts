import { schema, entity, relation, permission } from '@permify-toolkit/core';
import { createPermifyDecorators } from '@permify-toolkit/nestjs';

/**
 * DSL mirror of test-schema.perm. Defining the schema in TypeScript lets
 * createPermifyDecorators derive the set of valid permission names, so
 * typos in @CheckPermission become compile errors instead of runtime 403s.
 */
export const appSchema = schema({
  user: entity({}),
  organization: entity({
    relations: {
      member: relation('user'),
    },
    permissions: {
      view: permission('member'),
    },
  }),
  document: entity({
    relations: {
      owner: relation('user'),
      parent: relation('organization'),
    },
    permissions: {
      view: permission('owner or parent.view'),
      edit: permission('owner'),
    },
  }),
});

/**
 * Schema-typed CheckPermission and PermissionResult. Accept 'document.view',
 * 'view', etc. — anything outside the schema fails to compile.
 */
export const { CheckPermission, PermissionResult } =
  createPermifyDecorators<typeof appSchema>();
