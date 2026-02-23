import type { PermifyClientOptions, Config } from "@permify-toolkit/core";
import {
  type ExecutionContext,
  type ModuleMetadata,
  type Type,
  SetMetadata
} from "@nestjs/common";

import { PERMIFY_RESOLVERS_KEY } from "./constant.js";

/**
 * Represents a subject in the NestJS context (e.g. `user:1`).
 */
export interface PermifySubject {
  /** The subject type (e.g. `user`, `service`). */
  type: string;
  /** The unique subject ID. */
  id: string;
}

/**
 * Resolver function to extract the tenant ID from the execution context.
 */
export type TenantResolver = (
  context: ExecutionContext
) => string | Promise<string>;

/**
 * Resolver function to extract the subject from the execution context.
 *
 * Can return a simple ID string (defaults to type `user`) or a full {@link PermifySubject}.
 */
export type SubjectResolver = (
  context: ExecutionContext
) => string | PermifySubject | Promise<string | PermifySubject>;

/**
 * Resolver function to extract the resource from the execution context.
 *
 * Used by the {@link PermifyGuard} to determine which entity the permission
 * check should be performed against.
 */
export type ResourceResolver = (
  context: ExecutionContext
) => string | PermifySubject | Promise<string | PermifySubject>;

/**
 * Resolver function to generate metadata for a permission check.
 *
 * Useful for providing snap tokens, schema versions, or custom attributes
 * based on the current request.
 */
export type MetadataResolver = (context: ExecutionContext) =>
  | {
      /** Snap token for consistent reads. */
      snapToken?: string;
      /** Specific schema version. */
      schemaVersion?: string;
      /** Max recursion depth. */
      depth?: number;
      /** Additional metadata attributes. */
      [key: string]: unknown;
    }
  | Promise<{
      snapToken?: string;
      schemaVersion?: string;
      depth?: number;
      [key: string]: unknown;
    }>;

/**
 * A collection of resolvers used to extract Permify context from
 * NestJS execution contexts.
 */
export interface PermifyResolvers {
  /** Resolves the Permify tenant ID. */
  tenant?: TenantResolver;
  /** Resolves the subject (e.g. current user). */
  subject?: SubjectResolver;
  /** Resolves the target resource (e.g. document being accessed). */
  resource?: ResourceResolver;
  /** Resolves optional check metadata. */
  metadata?: MetadataResolver;
}

/**
 * Decorator to override Permify resolvers at the controller or method level.
 *
 * @param resolvers - The resolvers to override (tenant, subject).
 */
export const PermifyResolvers = (resolvers: Partial<PermifyResolvers>) =>
  SetMetadata(PERMIFY_RESOLVERS_KEY, resolvers);

/** Configuration interface for NestJS module initialization. */
export interface PermifyBaseOptions {
  /** Global resolvers used by the {@link PermifyGuard}. */
  resolvers?: PermifyResolvers;
}

/** Mode 1: Auto-load `permify.config.ts` from disk. */
export interface PermifyConfigFileOptions extends PermifyBaseOptions {
  /** Enable config file loading. */
  configFile: true;
  /** Optional path to the config file (defaults to `permify.config.ts` in CWD). */
  configFilePath?: string;
}

/** Mode 2: Provide a pre-loaded or manual configuration object. */
export interface PermifyConfigObjectOptions extends PermifyBaseOptions {
  /** The toolkit configuration object. */
  config: Config;
}

/** Mode 3: Direct gRPC client options (legacy/backwards compatible). */
export interface PermifyClientDirectOptions extends PermifyBaseOptions {
  /** Permify gRPC client options. */
  client: PermifyClientOptions;
}

/**
 * Union type for all supported Permify module initialization modes.
 */
export type PermifyModuleOptions =
  | PermifyConfigFileOptions
  | PermifyConfigObjectOptions
  | PermifyClientDirectOptions;

/** Interface for resolved options after processing initialization modes. */
export interface ResolvedPermifyOptions {
  /** Processed gRPC client options. */
  client: PermifyClientOptions;
  /** Default tenant ID from config. */
  tenant?: string;
  /** Processed global resolvers. */
  resolvers?: PermifyResolvers;
}

/** Interface for factories creating Permify module options. */
export interface PermifyModuleOptionsFactory {
  /** Method called to create the module options. */
  createPermifyOptions(): Promise<PermifyModuleOptions> | PermifyModuleOptions;
}

/** Interface for asynchronous Permify module initialization. */
export interface PermifyModuleAsyncOptions extends Pick<
  ModuleMetadata,
  "imports"
> {
  /** Existing provider to use for options. */
  useExisting?: Type<PermifyModuleOptionsFactory>;
  /** Class to instantiate for providing options. */
  useClass?: Type<PermifyModuleOptionsFactory>;
  /** Factory function to generate options. */
  useFactory?: (
    ...args: any[]
  ) => Promise<PermifyModuleOptions> | PermifyModuleOptions;
  /** Providers to inject into the factory. */
  inject?: any[];
}
