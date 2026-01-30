import {
  defineConfig,
  schema,
  entity,
  relation,
  permission
} from "@permify-toolkit/core";

export default defineConfig({
  client: {
    endpoint: "localhost:3478",
    insecure: true
  },
  schema: schema({
    user: entity({
      relations: {
        manager: relation("user")
      },
      permissions: {
        manage: permission("manager")
      }
    }),
    document: entity({
      relations: {
        owner: relation("user"),
        viewer: relation("user")
      },
      permissions: {
        view: permission("viewer or owner"),
        edit: permission("owner")
      }
    })
  })
});
