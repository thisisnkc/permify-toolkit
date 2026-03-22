import { Command } from "@oclif/core";
import fs from "node:fs";

import { loadConfig, validateSchemaContent, validateSchemaFile } from "../../helpers.js";

export default class SchemaValidate extends Command {
  static description =
    "Validate Permify schema syntax and references without pushing to the server";

  static args = {};
  static flags = {};

  async run() {
    // 1. Load config (requires permify.config.ts in cwd)
    let config;
    try {
      config = await loadConfig();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Schema must be provided")) {
        this.error("Schema not defined in config");
      }
      throw err;
    }

    if (!config.schema) {
      this.error("Schema not defined in config");
    }

    // 2. Resolve schema input
    //    For SchemaHandle: pass directly to validateSchemaContent for semantic checks.
    //    For string path: read the .perm file content for structural checks.
    let schemaInput: NonNullable<typeof config.schema>;
    if (typeof config.schema === "string") {
      const fullPath = validateSchemaFile(config.schema);
      schemaInput = fs.readFileSync(fullPath, "utf-8");
    } else {
      schemaInput = config.schema;
    }

    // 3. Validate
    try {
      validateSchemaContent(schemaInput);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.error(`Schema validation failed:\n${message}`);
    }

    this.log("✔ Schema is valid");
  }
}
