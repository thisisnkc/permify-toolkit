import { defineConfig, schemaFile } from '@permify-toolkit/core';

export default defineConfig({
  client: {
    endpoint: 'localhost:3478',
    insecure: true,
  },
  schema: schemaFile('./test-schema.perm'),
});
