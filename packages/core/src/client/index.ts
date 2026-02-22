import * as permify from "@permify/permify-node";

/**
 * Options for configuring the Permify gRPC client.
 *
 * Can be built manually or populated from environment variables
 * via {@link clientOptionsFromEnv}.
 */
export interface PermifyClientOptions {
  /** Permify server address in `host:port` format (e.g. `"localhost:3478"`). */
  endpoint: string;

  /**
   * Whether to use an insecure (plaintext) gRPC connection.
   *
   * - `true`  — no TLS (suitable for local development)
   * - `false` — TLS enabled (default for production)
   *
   * When omitted, defaults to `true` for `localhost` endpoints
   * and `false` for everything else.
   */
  insecure?: boolean;

  /** TLS certificate material for mutual-TLS connections. */
  tls?: {
    /** PEM-encoded TLS private key. */
    key?: string | Buffer;
    /** PEM-encoded TLS certificate. */
    cert?: string | Buffer;
    /** PEM-encoded CA certificate chain. */
    ca?: string | Buffer;
  };

  /** Arbitrary gRPC metadata headers sent with every request. */
  metadata?: Record<string, string>;

  /** Interceptor configuration for authentication. */
  interceptor?: {
    /** Bearer token passed via the Permify access-token interceptor. */
    authToken?: string;
  };

  /** Request timeout in milliseconds. */
  timeoutMs?: number;
}

/**
 * Builds {@link PermifyClientOptions} from environment variables.
 *
 * The `prefix` argument **replaces** the default `"PERMIFY_"` namespace —
 * it is _not_ prepended to it. The resulting variable names are:
 *
 * | Variable                | Default (`"PERMIFY_"`)    | Custom (`"MY_APP_"`)   |
 * |-------------------------|--------------------------|------------------------|
 * | Endpoint                | `PERMIFY_ENDPOINT`       | `MY_APP_ENDPOINT`      |
 * | Insecure flag           | `PERMIFY_INSECURE`       | `MY_APP_INSECURE`      |
 * | TLS certificate         | `PERMIFY_TLS_CERT`       | `MY_APP_TLS_CERT`      |
 * | TLS private key         | `PERMIFY_TLS_KEY`        | `MY_APP_TLS_KEY`       |
 * | TLS CA chain            | `PERMIFY_TLS_CA`         | `MY_APP_TLS_CA`        |
 * | Auth token              | `PERMIFY_AUTH_TOKEN`     | `MY_APP_AUTH_TOKEN`    |
 *
 * @example
 * ```typescript
 * // Default — reads PERMIFY_ENDPOINT, PERMIFY_INSECURE, etc.
 * const opts = clientOptionsFromEnv();
 *
 * // Custom prefix — reads MY_APP_ENDPOINT, MY_APP_INSECURE, etc.
 * const opts = clientOptionsFromEnv("MY_APP_");
 *
 * const client = createPermifyClient(opts);
 * ```
 *
 * @param prefix - Environment variable prefix. Defaults to `"PERMIFY_"`.
 * @returns A {@link PermifyClientOptions} object populated from `process.env`.
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
 * Creates a new Permify gRPC client.
 *
 * Validates the provided options, applies sensible defaults, and
 * returns a ready-to-use client backed by `@permify/permify-node`.
 *
 * **Default behaviours:**
 * - `insecure` defaults to `true` when the endpoint starts with
 *   `"localhost"`, and `false` otherwise.
 * - TLS values are automatically converted to `Buffer` when provided
 *   as strings.
 *
 * @example
 * ```typescript
 * // Minimal local setup
 * const client = createPermifyClient({
 *   endpoint: "localhost:3478",
 *   insecure: true,
 * });
 *
 * // Production with TLS and auth
 * const client = createPermifyClient({
 *   endpoint: "permify.prod.internal:3478",
 *   tls: {
 *     cert: fs.readFileSync("cert.pem"),
 *     key:  fs.readFileSync("key.pem"),
 *     ca:   fs.readFileSync("ca.pem"),
 *   },
 *   interceptor: { authToken: process.env.PERMIFY_TOKEN },
 * });
 * ```
 *
 * @param options - Client connection options (see {@link PermifyClientOptions}).
 * @returns A Permify gRPC client instance.
 * @throws {Error} If `endpoint` is missing or does not include a port.
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

/** Coerces a string or Buffer to a Buffer, returning `null` for falsy values. */
function toBuffer(val?: string | Buffer): Buffer | null {
  if (!val) return null;
  if (Buffer.isBuffer(val)) return val;
  return Buffer.from(val);
}
