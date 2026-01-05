import * as permify from "@permify/permify-node";

//** TODO: Add client options */
export function createPermifyClient(endpoint: string) {
  return permify.grpc.newClient({
    endpoint,
    cert: null,
    pk: null,
    certChain: null,
    insecure: true
  });
}
