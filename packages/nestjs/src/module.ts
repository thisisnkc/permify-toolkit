import { Module, Global } from "@nestjs/common";
import type { DynamicModule, Provider } from "@nestjs/common";

import { PermifyService } from "./service";
import { PERMIFY_MODULE_OPTIONS } from "./constant";
import type {
  PermifyModuleOptions,
  PermifyModuleAsyncOptions,
  PermifyModuleOptionsFactory
} from "./interfaces";

@Global()
@Module({})
export class PermifyModule {
  static forRoot(options: PermifyModuleOptions): DynamicModule {
    return {
      module: PermifyModule,
      providers: [
        {
          provide: PERMIFY_MODULE_OPTIONS,
          useValue: options
        },
        PermifyService
      ],
      exports: [PermifyService]
    };
  }

  static forRootAsync(options: PermifyModuleAsyncOptions): DynamicModule {
    return {
      module: PermifyModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), PermifyService],
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
        useFactory: options.useFactory,
        inject: options.inject || []
      };
    }
    const inject = [options.useExisting || options.useClass!];
    return {
      provide: PERMIFY_MODULE_OPTIONS,
      useFactory: async (optionsFactory: PermifyModuleOptionsFactory) =>
        await optionsFactory.createPermifyOptions(),
      inject
    };
  }
}
