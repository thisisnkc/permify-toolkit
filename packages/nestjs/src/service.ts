import { Injectable, Inject } from "@nestjs/common";
import { createPermifyClient } from "@permify-toolkit/core";

import { PERMIFY_MODULE_OPTIONS } from "./constant";
import type { PermifyModuleOptions } from "./interfaces";

@Injectable()
export class PermifyService {
  readonly client: ReturnType<typeof createPermifyClient>;

  constructor(
    @Inject(PERMIFY_MODULE_OPTIONS)
    private readonly options: PermifyModuleOptions
  ) {
    this.client = createPermifyClient(options.client);
  }

  getTenantResolver() {
    return this.options.tenantResolver;
  }
}
