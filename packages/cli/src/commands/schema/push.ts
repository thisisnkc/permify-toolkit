import path from "node:path";
import fs from "node:fs/promises";
import { Args, Command, Flags } from "@oclif/core";
import type { DefineSchemaInput } from "@permify-toolkit/core";
import { defineSchema, writeSchemaToPermify } from "@permify-toolkit/core";

export default class SchemaPush extends Command {
  static description = "Push Permify schema to the server";

  static args = {
    filePath: Args.string({
      required: true,
      description: "Path to schema JSON file"
    })
  };

  static flags = {
    endpoint: Flags.string({
      description: "Permify server endpoint",
      env: "PERMIFY_ENDPOINT",
      required: true
    }),
    tenant: Flags.string({
      description: "Permify tenant ID",
      env: "PERMIFY_TENANT",
      required: true
    })
  };

  async run() {
    const { args, flags } = await this.parse(SchemaPush);

    const filePath = path.resolve(args.filePath);

    // 1️⃣ Load schema file
    const schemaInput = await this.loadJsonFile(filePath);

    // 2️⃣ Build schema via core
    const schema = this.buildSchema(schemaInput);

    // 3️⃣ Push schema via core
    await this.pushSchema(schema.ast, flags.endpoint, flags.tenant);

    this.log(`✔ Schema pushed successfully`);
    this.log(`Tenant: ${flags.tenant}`);
  }

  // ---------- helpers ----------

  private async loadJsonFile(filePath: string): Promise<unknown> {
    if (!filePath.endsWith(".json")) {
      this.error("Only .json schema files are supported");
    }

    try {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (err: any) {
      this.error(`Failed to read or parse JSON file: ${err.message}`);
    }
  }

  /**
   * TODO -> add JOI validation before defineSchema
   */
  private buildSchema(input: unknown) {
    try {
      return defineSchema(input as DefineSchemaInput);
    } catch (err: any) {
      this.error(`Invalid schema definition:\n${err.message}`);
    }
  }

  private async pushSchema(ast: any, endpoint: string, tenantId: string) {
    try {
      await writeSchemaToPermify({
        endpoint,
        tenantId,
        ast
      });
    } catch (err: any) {
      this.error(`Schema push failed:\n${err.message}`);
    }
  }
}
