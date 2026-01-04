import * as permify from "@permify/permify-node";

//** TODO: Add client options */
export function createPermifyClient() {
  return permify.grpc.newClient({
    endpoint: "localhost:3478",
    cert: null,
    pk: null,
    certChain: null,
    insecure: true
  });
}
