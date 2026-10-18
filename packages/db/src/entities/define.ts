import { defineEntity, p } from "@mikro-orm/core";
import { baseEntityProperties } from "./base.entity";

/**
 * Thin wrapper over `defineEntity()` that merges in the shared base columns
 * (id/createdAt/updatedAt) via plain object spread — composition instead of
 * MikroORM's table-inheritance `extends`, which is overkill for shared
 * columns (see engineering-standards.md).
 */
export function defineDomainEntity<
  TName extends string,
  TTableName extends string,
  TProperties extends Record<string, unknown>,
>(meta: {
  name: TName;
  tableName: TTableName;
  properties: (properties: typeof p) => TProperties;
}) {
  return defineEntity({
    name: meta.name,
    tableName: meta.tableName,
    properties: () => ({
      ...baseEntityProperties(),
      ...meta.properties(p),
    }),
  });
}
