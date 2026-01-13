import { Command, Flags } from "@oclif/core";
import { writeSchemaToPermify } from "@permify-toolkit/core";

import { loadConfig } from "../../helpers.js";

export default class SchemaPush extends Command {
  static description = "Push Permify schema to the server";

  static args = {};

  static flags = {
    tenant: Flags.string({
      description: "Permify tenant ID",
      env: "PERMIFY_TENANT",
      required: true
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

    // 2️⃣ Push schema via core
    await this.pushSchema(
      config.schema.ast,
      config.client.endpoint,
      flags.tenant
    );

    this.log(`✔ Schema pushed successfully`);
    this.log(`Tenant: ${flags.tenant}`);
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
