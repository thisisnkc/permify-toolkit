import * as permify from "@permify/permify-node";

export interface PermifyClientOptions {
  endpoint: string;
  insecure?: boolean;
  tls?: {
    key?: string | Buffer;
    cert?: string | Buffer;
    ca?: string | Buffer;
  };
  metadata?: Record<string, string>;
  interceptor?: {
    authToken?: string;
  };
  timeoutMs?: number;
}

/**
 * Creates client options from environment variables.
 *
 * @param prefix - The prefix for environment variables (default: "PERMIFY_")
 * @returns PermifyClientOptions populated from environment variables
 */
export function clientOptionsFromEnv(
  prefix = "PERMIFY_"
): PermifyClientOptions {
  const options: PermifyClientOptions = {
    endpoint: process.env[`${prefix}ENDPOINT`]!,
    insecure: process.env[`${prefix}INSECURE`] === "true",
    tls: {
      cert: process.env[`${prefix}TLS_CERT`],
      key: process.env[`${prefix}TLS_KEY`],
      ca: process.env[`${prefix}TLS_CA`]
    }
  };

  const authToken = process.env[`${prefix}AUTH_TOKEN`];
  if (authToken) {
    options.interceptor = { authToken };
  }

  return options;
}

/**
 * Creates a new Permify gRPC client with improved validation and defaults.
 *
 * @param options - The client options
 * @returns The Permify gRPC client
 */
export function createPermifyClient(options: PermifyClientOptions) {
  if (!options?.endpoint) {
    throw new Error("Permify client requires an endpoint");
  }

  if (!options.endpoint.includes(":")) {
    throw new Error("Permify endpoint must include host:port");
  }

  const grpcOptions: any = {
    endpoint: options.endpoint
  };

  // Safe default for insecure if not provided
  if (options.insecure === undefined) {
    grpcOptions.insecure = options.endpoint.startsWith("localhost");
  } else {
    grpcOptions.insecure = options.insecure;
  }

  if (options.tls) {
    grpcOptions.cert = toBuffer(options.tls.cert);
    grpcOptions.pk = toBuffer(options.tls.key);
    grpcOptions.certChain = toBuffer(options.tls.ca);
  }

  if (options.metadata) {
    grpcOptions.metadata = options.metadata;
  }

  if (options.timeoutMs) {
    grpcOptions.timeout = options.timeoutMs;
  }

  const interceptors: any[] = [];
  if (options.interceptor?.authToken) {
    interceptors.push(
      permify.grpc.newAccessTokenInterceptor(options.interceptor.authToken)
    );
  }

  return permify.grpc.newClient(grpcOptions, ...interceptors);
}

function toBuffer(val?: string | Buffer): Buffer | null {
  if (!val) return null;
  if (Buffer.isBuffer(val)) return val;
  return Buffer.from(val);
}
