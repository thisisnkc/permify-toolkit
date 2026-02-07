import {
  BasePermifyWriter,
  type BaseWriteParams,
  type BaseWriterResult
} from "../common/base-writer.js";

interface WriteSchemaParams extends BaseWriteParams {
  schema: string;
}

interface WriteSchemaResult extends BaseWriterResult {
  schema: string;
}

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
 * Writes the schema DSL to the Permify server.
 * Permify validates the schema and returns an error if invalid.
 */
export async function writeSchemaToPermify(
  params: WriteSchemaParams
): Promise<WriteSchemaResult> {
  const writer = new SchemaWriter();
  return writer.execute(params);
}
