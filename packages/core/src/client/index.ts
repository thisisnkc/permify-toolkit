import * as permify from "@permify/permify-node";

import type { PermifyClientOptions } from "../config.js";

export function createPermifyClient(options: PermifyClientOptions) {
  return permify.grpc.newClient({
    endpoint: options.endpoint,
    insecure: options.insecure ?? false,
    cert: options.cert ? Buffer.from(options.cert) : null,
    pk: options.pk ? Buffer.from(options.pk) : null,
    certChain: options.certChain ? Buffer.from(options.certChain) : null
  });
}
