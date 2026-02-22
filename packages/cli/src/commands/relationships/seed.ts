import fs from "node:fs";
import path from "node:path";
import { Flags } from "@oclif/core";
import { writeRelationships, type Relationship } from "@permify-toolkit/core";

import { BaseCommand } from "../../base.js";

export default class RelationshipSeed extends BaseCommand {
  static description = "Seed relationships from a JSON file";

  static flags = {
    ...BaseCommand.baseFlags,
    "file-path": Flags.string({
      char: "f",
      description: "Path to the relationship JSON file",
      required: true
    })
  };

  async run() {
    const { flags } = await this.parse(RelationshipSeed);

    // 1. Validate File
    const relationships = this.validateRelationshipFile(flags["file-path"]);

    if (relationships.length === 0) {
      this.log("No relationships found in file.");
      return;
    }

    // 2. Initialize Client
    const { client, config } = await this.clientFromConfig();

    // 3. Resolve tenant
    const tenantId = this.resolveTenant(flags, config);

    // 4. Write Relationships
    try {
      this.log(`Seeding ${relationships.length} relationships...`);
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

      this.log(`✔ Successfully seeded ${result.count} relationships.`);
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
      this.error("File content must be an array of relationships");
    }

    return relationships.tuples;
  }
}
