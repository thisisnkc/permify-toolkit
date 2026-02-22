import {
  BasePermifyWriter,
  type BaseWriteParams,
  type BaseWriterResult
} from "../common/base-writer.js";

/**
 * Parameters for writing a schema to the Permify server.
 */
export interface WriteSchemaParams extends BaseWriteParams {
  /** The schema in Permify DSL format. */
  schema: string;
}

/**
 * The result of writing a schema.
 */
export interface WriteSchemaResult extends BaseWriterResult {
  /** The schema that was written. */
  schema: string;
}

/**
 * Internal schema writer class.
 */
class SchemaWriter extends BasePermifyWriter<
  WriteSchemaParams,
  { schema: string }
> {
  protected validate(params: WriteSchemaParams): void {
    super.validate(params);
    if (!params.schema) throw new Error("Schema is required");
    if (typeof params.schema !== "string")
      throw new Error("Schema must be a string");
  }

  protected async performWrite(
    client: any,
    params: WriteSchemaParams
  ): Promise<{ schema: string }> {
    await client.schema.write({
      tenantId: params.tenantId,
      schema: params.schema
    });
    return { schema: params.schema };
  }
}

/**
 * Writes a compiled schema DSL to the Permify server.
 *
 * Permify will validate the schema string and return an error if it
 * is syntactically or logically invalid.
 *
 * @param params - The schema content and target tenant.
 * @returns A promise that resolves with the written schema.
 *
 * @example
 * ```typescript
 * const res = await writeSchemaToPermify({
 *   tenantId: 'my-tenant',
 *   schema: 'entity user {} entity document { relation owner @user }',
 * });
 * ```
 */
export async function writeSchemaToPermify(
  params: WriteSchemaParams
): Promise<WriteSchemaResult> {
  const writer = new SchemaWriter();
  return writer.execute(params);
}
