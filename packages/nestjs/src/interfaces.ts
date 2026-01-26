import type { PermifyClientOptions } from "@permify-toolkit/core";
import type { ExecutionContext, ModuleMetadata, Type } from "@nestjs/common";

export interface PermifyModuleOptions {
  client: PermifyClientOptions;
  tenantResolver: (context: ExecutionContext) => string | Promise<string>;
}

export interface PermifyModuleOptionsFactory {
  createPermifyOptions(): Promise<PermifyModuleOptions> | PermifyModuleOptions;
}

export interface PermifyModuleAsyncOptions extends Pick<
  ModuleMetadata,
  "imports"
> {
  useExisting?: Type<PermifyModuleOptionsFactory>;
  useClass?: Type<PermifyModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<PermifyModuleOptions> | PermifyModuleOptions;
  inject?: any[];
}
