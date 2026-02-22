import fs from "node:fs";
import path from "node:path";
import { Flags } from "@oclif/core";
import {
  writeRelationships,
  deleteRelationships,
  SeedingMode,
  type Relationship
} from "@permify-toolkit/core";

import { BaseCommand } from "../../base.js";

export default class RelationshipSeed extends BaseCommand {
  static description = "Seed relationships from a JSON file";

  static flags = {
    ...BaseCommand.baseFlags,
    "file-path": Flags.string({
      char: "f",
      description: "Path to the relationship JSON file",
      required: false
    })
  };

  async run() {
    const { flags } = await this.parse(RelationshipSeed);

    // 1. Initialize Client and Load Config
    const { client, config } = await this.clientFromConfig();

    // 2. Resolve File Path
    const filePath = flags["file-path"] || config.relationships?.seedFile;

    if (!filePath) {
      this.error(
        "Relationship file path is required. Provide --file-path flag or set relationships.seedFile in permify.config.ts"
      );
    }

    // 3. Resolve Mode
    const mode = config.relationships?.mode || SeedingMode.APPEND;
    if (!Object.values(SeedingMode).includes(mode as SeedingMode)) {
      this.error(
        `Invalid mode in config: ${mode}. Must be one of: ${Object.values(SeedingMode).join(", ")}`
      );
    }

    // 4. Resolve tenant
    const tenantId = this.resolveTenant(flags, config);

    // 5. Validate File
    const relationships = this.validateRelationshipFile(filePath);

    if (relationships.length === 0) {
      this.log("⚠ No relationships found in file. Doing nothing.");
      return;
    }

    // 6. Handle Replace Mode
    if (mode === SeedingMode.REPLACE) {
      this.log(
        `Replacing all relationships for tenant "${tenantId}" (mode: replace)`
      );
      try {
        await deleteRelationships({
          client,
          tenantId,
          endpoint: "",
          filter: {}
        });
      } catch (err: any) {
        this.error(`Failed to clear existing relationships: ${err.message}`);
      }
    }

    // 7. Write Relationships
    try {
      this.log(
        `Seeding ${relationships.length} relationships (mode: ${mode})...`
      );
      const result = await writeRelationships({
        client,
        tenantId,
        relationships: { tuples: relationships },
        createTenantIfNotExists: flags["create-tenant"],
        endpoint: ""
      });

      if (result.tenantStatus.created) {
        this.log(`✔ Tenant created successfully`);
      } else if (result.tenantStatus.alreadyExisted && flags["create-tenant"]) {
        this.log(`ℹ Tenant already exists`);
      }

      const statusMsg = mode === SeedingMode.REPLACE ? "replaced" : "seeded";
      this.log(`✔ Successfully ${statusMsg} ${result.count} relationships.`);
    } catch (err: any) {
      this.error(`Failed during seed: ${err.message}`);
    }
  }

  private validateRelationshipFile(filePath: string): Relationship[] {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      this.error(`File not found: ${fullPath}`);
    }

    let fileContent: string;
    try {
      fileContent = fs.readFileSync(fullPath, "utf-8");
    } catch (err: any) {
      this.error(`Failed to read file: ${err.message}`);
    }

    if (!fileContent.trim()) {
      this.error("File is empty");
    }

    let relationships: { tuples: Relationship[] };
    try {
      relationships = JSON.parse(fileContent);
    } catch (err: any) {
      this.error(`Invalid JSON: ${err.message}`);
    }

    if (!Array.isArray(relationships.tuples)) {
      this.error("File content must contain a 'tuples' array of relationships");
    }

    return relationships.tuples;
  }
}
