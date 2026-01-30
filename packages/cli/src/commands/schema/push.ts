import { Command, Flags } from "@oclif/core";
import {
  writeSchemaToPermify,
  createPermifyClient
} from "@permify-toolkit/core";

import { loadConfig, loadSchemaFromConfig } from "../../helpers.js";

export default class SchemaPush extends Command {
  static description = "Push Permify schema to the server";

  static args = {};

  static flags = {
    tenant: Flags.string({
      description: "Permify tenant ID",
      env: "PERMIFY_TENANT",
      required: true
    }),
    "create-tenant": Flags.boolean({
      char: "c",
      description: "Create tenant if it does not exist",
      default: false
    })
  };

  async run() {
    const { flags } = await this.parse(SchemaPush);

    // 1️⃣ Load config
    const config = await loadConfig();

    if (!config.schema) {
      this.error("Schema not defined in config");
    }

    if (!config.client?.endpoint) {
      this.error("Client endpoint not defined in config");
    }

    // 2️⃣ Load schema (compile AST or read file)
    let dsl: string;
    try {
      dsl = loadSchemaFromConfig(config.schema);
    } catch (err: any) {
      this.error(`Failed to load schema: ${err.message}`);
    }

    // 3️⃣ Create client with full config
    const client = createPermifyClient(config.client);

    // 4️⃣ Push schema via core
    await this.pushSchema(dsl, client, flags.tenant, flags["create-tenant"]);

    this.log(`✔ Schema pushed successfully`);
    this.log(`Tenant: ${flags.tenant}`);
  }

  private async pushSchema(
    schema: string,
    client: any,
    tenantId: string,
    createTenantIfNotExists?: boolean
  ) {
    try {
      await writeSchemaToPermify({
        endpoint: "",
        tenantId,
        schema,
        createTenantIfNotExists,
        client
      });
    } catch (err: any) {
      this.error(`Schema push failed:\n${err.message}`);
    }
  }
}
