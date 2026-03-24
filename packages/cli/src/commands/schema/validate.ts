import fs from "node:fs";
import { Command } from "@oclif/core";

import {
  loadConfig,
  validateSchemaContent,
  validateSchemaFile
} from "../../helpers.js";

export default class SchemaValidate extends Command {
  static description =
    "Validate Permify schema syntax and references without pushing to the server";

  static args = {};
  static flags = {};

  async run() {
    // 1. Load config
    const config = await loadConfig();

    // 2. Resolve schema input
    let schemaInput: NonNullable<typeof config.schema>;
    if (typeof config.schema === "string") {
      const fullPath = validateSchemaFile(config.schema);
      schemaInput = fs.readFileSync(fullPath, "utf-8");
    } else {
      schemaInput = config.schema;
    }

    // 3. Validate — throws on hard errors
    let warnings: string[] = [];
    try {
      const result = validateSchemaContent(schemaInput);
      warnings = result.warnings;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.error(`Schema validation failed:\n${message}`);
    }

    // 4. Report result
    if (warnings.length > 0) {
      this.log("⚠ Schema is valid with warnings\n");
      this.log("Warnings:");
      warnings.forEach((w, i) => this.log(`  ${i + 1}. ${w}`));
    } else {
      this.log("✔ Schema is valid");
    }
  }
}
