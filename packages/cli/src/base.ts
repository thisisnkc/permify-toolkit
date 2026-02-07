import { Command, Flags } from "@oclif/core";
import { createPermifyClient, type Config } from "@permify-toolkit/core";

import { loadConfig } from "./helpers.js";

export abstract class BaseCommand extends Command {
  static baseFlags = {
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

  protected async clientFromConfig(): Promise<{
    client: any;
    config: Config;
  }> {
    const config = await loadConfig();

    if (!config.schema) {
      this.error("Schema not defined in config");
    }

    if (!config.client?.endpoint) {
      this.error("Client endpoint not defined in config");
    }

    const client = createPermifyClient(config.client);
    return { client, config };
  }
}
