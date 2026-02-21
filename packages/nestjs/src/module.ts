import { Reflector } from "@nestjs/core";
import { Module, Global } from "@nestjs/common";
import { loadConfig } from "@permify-toolkit/core";
import type { DynamicModule, Provider } from "@nestjs/common";

import { PermifyService } from "./service.js";
import { PERMIFY_MODULE_OPTIONS } from "./constant.js";
import type {
  PermifyModuleOptions,
  PermifyModuleAsyncOptions,
  PermifyModuleOptionsFactory,
  ResolvedPermifyOptions
} from "./interfaces.js";

/**
 * Resolves the three option modes into a single `ResolvedPermifyOptions` shape.
 *
 * Precedence: config > configFile > client
 */
async function resolveModuleOptions(
  options: PermifyModuleOptions
): Promise<ResolvedPermifyOptions> {
  if ("config" in options) {
    return {
      client: options.config.client,
      tenant: options.config.tenant,
      resolvers: options.resolvers
    };
  }

  if ("configFile" in options && options.configFile) {
    const config = await loadConfig(options.configFilePath);
    return {
      client: config.client,
      tenant: config.tenant,
      resolvers: options.resolvers
    };
  }

  // "client" mode (backwards compatible)
  const clientOptions = options as { client: any; resolvers?: any };
  return {
    client: clientOptions.client,
    resolvers: clientOptions.resolvers
  };
}

@Global()
@Module({})
export class PermifyModule {
  static forRoot(options: PermifyModuleOptions): DynamicModule {
    return {
      module: PermifyModule,
      providers: [
        {
          provide: PERMIFY_MODULE_OPTIONS,
          useFactory: () => resolveModuleOptions(options)
        },
        Reflector,
        PermifyService
      ],
      exports: [PermifyService]
    };
  }

  static forRootAsync(options: PermifyModuleAsyncOptions): DynamicModule {
    return {
      module: PermifyModule,
      imports: options.imports || [],
      providers: [
        ...this.createAsyncProviders(options),
        Reflector,
        PermifyService
      ],
      exports: [PermifyService]
    };
  }

  private static createAsyncProviders(
    options: PermifyModuleAsyncOptions
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass!,
        useClass: options.useClass!
      }
    ];
  }

  private static createAsyncOptionsProvider(
    options: PermifyModuleAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: PERMIFY_MODULE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const moduleOptions = await options.useFactory!(...args);
          return resolveModuleOptions(moduleOptions);
        },
        inject: options.inject || []
      };
    }
    const inject = [options.useExisting || options.useClass!];
    return {
      provide: PERMIFY_MODULE_OPTIONS,
      useFactory: async (optionsFactory: PermifyModuleOptionsFactory) => {
        const moduleOptions = await optionsFactory.createPermifyOptions();
        return resolveModuleOptions(moduleOptions);
      },
      inject
    };
  }
}
