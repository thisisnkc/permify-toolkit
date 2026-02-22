import {
  clientOptionsFromEnv,
  defineConfig,
  schemaFile,
} from '@permify-toolkit/core';

export default defineConfig({
  client: clientOptionsFromEnv('PHYG_'),
  tenant: 'toolkit-test',
  schema: schemaFile('./test-schema.perm'),
});
