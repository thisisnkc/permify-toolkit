import "@japa/assert";

import { test } from "@japa/runner";

import { readSchemaFromPermify } from "../src/schema/read-schema.js";

// --- mock client helpers ---

function mockClient(opts: {
  head?: string;
  entityDefinitions?: Record<string, any>;
  listError?: boolean;
}) {
  return {
    schema: {
      list: async () => {
        if (opts.listError) throw new Error("connection refused");
        return { head: opts.head ?? "", schemas: [], continuousToken: "" };
      },
      read: async () => ({
        schema: {
          entityDefinitions: opts.entityDefinitions ?? {},
          ruleDefinitions: {},
          references: {}
        }
      })
    }
  };
}

test.group("readSchemaFromPermify - validation", () => {
  test("throws when neither client nor endpoint provided", async ({
    assert
  }) => {
    try {
      await readSchemaFromPermify({ tenantId: "t1" });
      assert.fail("Should have thrown");
    } catch (err: unknown) {
      assert.include((err as Error).message, "Either endpoint or client");
    }
  });

  test("throws when tenantId is empty", async ({ assert }) => {
    const client = mockClient({});
    try {
      await readSchemaFromPermify({ tenantId: "", client });
      assert.fail("Should have thrown");
    } catch (err: unknown) {
      assert.include((err as Error).message, "Tenant ID is required");
    }
  });
});

test.group("readSchemaFromPermify - no schema on server", () => {
  test("returns null schema when head is empty", async ({ assert }) => {
    const client = mockClient({ head: "" });
    const result = await readSchemaFromPermify({ tenantId: "t1", client });

    assert.isNull(result.schema);
    assert.deepEqual(result.entities, {});
  });

  test("returns null schema when list throws", async ({ assert }) => {
    const client = mockClient({ listError: true });
    const result = await readSchemaFromPermify({ tenantId: "t1", client });

    assert.isNull(result.schema);
    assert.deepEqual(result.entities, {});
  });
});

test.group("readSchemaFromPermify - successful read", () => {
  test("extracts entity names and relations", async ({ assert }) => {
    const client = mockClient({
      head: "v1",
      entityDefinitions: {
        user: { relations: {}, permissions: {} },
        document: {
          relations: {
            owner: {
              relationReferences: [{ type: "user", relation: "" }]
            }
          },
          permissions: {
            edit: {
              child: {
                leaf: { computedUserSet: { relation: "owner" } }
              }
            }
          }
        }
      }
    });

    const result = await readSchemaFromPermify({ tenantId: "t1", client });

    assert.isNotNull(result.schema);
    assert.property(result.entities, "user");
    assert.property(result.entities, "document");
    assert.deepEqual(result.entities.document.relations, { owner: "@user" });
    assert.deepEqual(result.entities.document.permissions, { edit: "owner" });
  });

  test("handles multiple relation targets", async ({ assert }) => {
    const client = mockClient({
      head: "v1",
      entityDefinitions: {
        document: {
          relations: {
            viewer: {
              relationReferences: [
                { type: "user", relation: "" },
                { type: "organization", relation: "member" }
              ]
            }
          },
          permissions: {}
        }
      }
    });

    const result = await readSchemaFromPermify({ tenantId: "t1", client });
    assert.equal(
      result.entities.document.relations.viewer,
      "@user or @organization#member"
    );
  });

  test("reconstructs DSL string", async ({ assert }) => {
    const client = mockClient({
      head: "v1",
      entityDefinitions: {
        user: { relations: {}, permissions: {} },
        document: {
          relations: {
            owner: {
              relationReferences: [{ type: "user", relation: "" }]
            }
          },
          permissions: {
            edit: {
              child: {
                leaf: { computedUserSet: { relation: "owner" } }
              }
            }
          }
        }
      }
    });

    const result = await readSchemaFromPermify({ tenantId: "t1", client });

    assert.include(result.schema!, "entity user {");
    assert.include(result.schema!, "entity document {");
    assert.include(result.schema!, "relation owner @user");
    assert.include(result.schema!, "permission edit = owner");
  });
});

test.group(
  "readSchemaFromPermify - permission expression reconstruction",
  () => {
    test("reconstructs union (or) expression", async ({ assert }) => {
      const client = mockClient({
        head: "v1",
        entityDefinitions: {
          doc: {
            relations: {},
            permissions: {
              view: {
                child: {
                  rewrite: {
                    rewriteOperation: "OPERATION_UNION",
                    children: [
                      { leaf: { computedUserSet: { relation: "owner" } } },
                      { leaf: { computedUserSet: { relation: "viewer" } } }
                    ]
                  }
                }
              }
            }
          }
        }
      });

      const result = await readSchemaFromPermify({ tenantId: "t1", client });
      assert.equal(result.entities.doc.permissions.view, "owner or viewer");
    });

    test("reconstructs intersection (and) expression", async ({ assert }) => {
      const client = mockClient({
        head: "v1",
        entityDefinitions: {
          doc: {
            relations: {},
            permissions: {
              view: {
                child: {
                  rewrite: {
                    rewriteOperation: "OPERATION_INTERSECTION",
                    children: [
                      { leaf: { computedUserSet: { relation: "owner" } } },
                      { leaf: { computedUserSet: { relation: "member" } } }
                    ]
                  }
                }
              }
            }
          }
        }
      });

      const result = await readSchemaFromPermify({ tenantId: "t1", client });
      assert.equal(result.entities.doc.permissions.view, "owner and member");
    });

    test("reconstructs tuple-to-userset (dot traversal) expression", async ({
      assert
    }) => {
      const client = mockClient({
        head: "v1",
        entityDefinitions: {
          doc: {
            relations: {},
            permissions: {
              view: {
                child: {
                  leaf: {
                    tupleToUserSet: {
                      tupleSet: { relation: "parent" },
                      computed: { relation: "view" }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const result = await readSchemaFromPermify({ tenantId: "t1", client });
      assert.equal(result.entities.doc.permissions.view, "parent.view");
    });
  }
);
