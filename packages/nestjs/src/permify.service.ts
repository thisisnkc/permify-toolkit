import { Injectable, Inject, Logger } from "@nestjs/common";
import { createPermifyClient } from "@permify-toolkit/core";
import { PERMIFY_MODULE_OPTIONS } from "./constant.js";
import { PermifyModuleOptions } from "./interfaces.js";

@Injectable()
export class PermifyService {
  readonly client: ReturnType<typeof createPermifyClient>;
  private readonly logger = new Logger(PermifyService.name);

  constructor(
    @Inject(PERMIFY_MODULE_OPTIONS)
    private readonly options: PermifyModuleOptions
  ) {
    this.logger.log(
      `Initializing Permify client with endpoint: ${options.client.endpoint}`
    );
    this.client = createPermifyClient(options.client.endpoint);
  }

  getTenantResolver() {
    return this.options.tenantResolver;
  }
}
