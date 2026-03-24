import "@japa/assert";

import { test } from "@japa/runner";

import type { SchemaAST } from "../src/schema/ast.js";
import { validateSchema, getSchemaWarnings } from "../src/schema/validate.js";

function userEntity(): SchemaAST["entities"][string] {
  return { name: "user", relations: {}, permissions: {}, attributes: {} };
}

function docEntity(
  permissions: SchemaAST["entities"][string]["permissions"]
): SchemaAST["entities"][string] {
  return {
    name: "document",
    relations: { owner: { name: "owner", target: ["user"] } },
    permissions,
    attributes: {}
  };
}

test.group("validateSchema - empty schema", () => {
  test("throws when schema has no entities", ({ assert }) => {
    const ast: SchemaAST = { entities: {} };

    try {
      validateSchema(ast);
      assert.fail("Should have thrown an empty-schema error");
    } catch (err: unknown) {
      assert.include((err as Error).message, "entity");
    }
  });
});

test.group("validateSchema - empty permission expression", () => {
  test("throws when a permission expression is empty", ({ assert }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(),
        document: docEntity({ view: { name: "view", expression: "" } })
      }
    };

    let threw = false;
    let message = "";
    try {
      validateSchema(ast);
    } catch (err: unknown) {
      threw = true;
      message = (err as Error).message;
    }

    assert.isTrue(threw, "validateSchema should throw for empty expression");
    assert.include(message, "empty");
  });
});

test.group("validateSchema - expression token order", () => {
  test("throws when two identifiers appear with no operator between them", ({
    assert
  }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(),
        document: {
          name: "document",
          relations: {
            owner: { name: "owner", target: ["user"] },
            viewer: { name: "viewer", target: ["user"] }
          },
          permissions: {
            view: { name: "view", expression: "viewer owner" }
          },
          attributes: {}
        }
      }
    };

    let threw = false;
    let message = "";
    try {
      validateSchema(ast);
    } catch (err: unknown) {
      threw = true;
      message = (err as Error).message;
    }

    assert.isTrue(threw, "validateSchema should throw for missing operator");
    assert.include(message, "operator");
  });

  test("does not throw for valid binary expressions", ({ assert }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(),
        document: {
          name: "document",
          relations: {
            owner: { name: "owner", target: ["user"] },
            viewer: { name: "viewer", target: ["user"] }
          },
          permissions: {
            view: { name: "view", expression: "viewer or owner" },
            edit: { name: "edit", expression: "owner" },
            admin: { name: "admin", expression: "not viewer or owner" }
          },
          attributes: {}
        }
      }
    };

    validateSchema(ast);
    assert.isTrue(true);
  });
});

test.group("validateSchema - cycle detection", () => {
  test("throws on direct self-reference in permission", ({ assert }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(),
        document: docEntity({
          view: { name: "view", expression: "view" }
        })
      }
    };

    try {
      validateSchema(ast);
      assert.fail("Should have thrown a cycle error");
    } catch (err: unknown) {
      assert.include((err as Error).message, "cycle");
    }
  });

  test("throws on indirect cycle between permissions", ({ assert }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(),
        document: docEntity({
          view: { name: "view", expression: "edit" },
          edit: { name: "edit", expression: "view" }
        })
      }
    };

    try {
      validateSchema(ast);
      assert.fail("Should have thrown a cycle error");
    } catch (err: unknown) {
      assert.include((err as Error).message, "cycle");
    }
  });

  test("does not throw for valid non-cyclic permission chain", ({ assert }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(),
        document: docEntity({
          edit: { name: "edit", expression: "owner" },
          view: { name: "view", expression: "edit" }
        })
      }
    };

    validateSchema(ast);
    assert.isTrue(true);
  });
});

test.group("getSchemaWarnings", () => {
  test("warns about an unused relation", ({ assert }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(),
        document: {
          name: "document",
          relations: {
            owner: { name: "owner", target: ["user"] },
            viewer: { name: "viewer", target: ["user"] }
          },
          permissions: {
            view: { name: "view", expression: "owner" }
          },
          attributes: {}
        }
      }
    };

    const warnings = getSchemaWarnings(ast);
    assert.isTrue(
      warnings.some((w) => w.includes("viewer") && w.includes("never used"))
    );
  });

  test("warns when an entity has no permissions", ({ assert }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(),
        document: {
          name: "document",
          relations: { owner: { name: "owner", target: ["user"] } },
          permissions: {},
          attributes: {}
        }
      }
    };

    const warnings = getSchemaWarnings(ast);
    assert.isTrue(
      warnings.some(
        (w) => w.includes("document") && w.includes("no permissions")
      )
    );
  });

  test("warns about entity that is empty and not referenced by any other entity", ({
    assert
  }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(), // empty but referenced as target — no warning expected
        document: docEntity({ view: { name: "view", expression: "owner" } }),
        // orphan: empty AND not referenced anywhere
        orphan: {
          name: "orphan",
          relations: {},
          permissions: {},
          attributes: {}
        }
      }
    };

    const warnings = getSchemaWarnings(ast);
    assert.isTrue(
      warnings.some((w) => w.includes("orphan") && w.includes("empty")),
      `Expected empty-entity warning for orphan, got: ${JSON.stringify(warnings)}`
    );
    assert.isFalse(
      warnings.some((w) => w.includes("user") && w.includes("empty")),
      "user is referenced as target so should not trigger empty warning"
    );
  });

  test("returns no warnings for a clean schema", ({ assert }) => {
    const ast: SchemaAST = {
      entities: {
        user: userEntity(),
        document: docEntity({
          view: { name: "view", expression: "owner" }
        })
      }
    };

    const warnings = getSchemaWarnings(ast);
    assert.deepEqual(warnings, []);
  });
});
