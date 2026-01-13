import { defineConfig, schema, entity } from "@permify-toolkit/core";

export default defineConfig({
  client: {
    endpoint: "localhost:3478"
  },
  schema: schema({
    user: entity({})
  })
});
