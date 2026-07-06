import "reflect-metadata";

import { test } from "@japa/runner";
import { schema, entity, relation, permission } from "@permify-toolkit/core";

import { PERMIFY_PERMISSION_KEY } from "../src/constant.js";
import { createPermifyDecorators } from "../src/typed-decorators.js";

const _appSchema = schema({
  user: entity({}),
  document: entity({
    relations: { owner: relation("user") },
    permissions: { view: permission("owner"), edit: permission("owner") }
  })
});

const { CheckPermission } = createPermifyDecorators<typeof _appSchema>();

const getMetadata = (target: object) =>
  Reflect.getMetadata(PERMIFY_PERMISSION_KEY, target);

test.group("createPermifyDecorators", () => {
  test("delegates single permission to base decorator", ({ assert }) => {
    class TestClass {
      @CheckPermission("document.edit")
      method() {}
    }

    const metadata = getMetadata(TestClass.prototype.method);
    assert.deepEqual(metadata.permissions, ["document.edit"]);
    assert.equal(metadata.mode, "AND");
  });

  test("delegates array with OR mode", ({ assert }) => {
    class TestClass {
      @CheckPermission(["document.view", "document.edit"], { mode: "OR" })
      method() {}
    }

    const metadata = getMetadata(TestClass.prototype.method);
    assert.deepEqual(metadata.permissions, ["document.view", "document.edit"]);
    assert.equal(metadata.mode, "OR");
  });

  test("accepts bare and relation names", ({ assert }) => {
    class TestClass {
      @CheckPermission(["view", "owner"])
      method() {}
    }

    const metadata = getMetadata(TestClass.prototype.method);
    assert.deepEqual(metadata.permissions, ["view", "owner"]);
  });

  /**
   * Compile-time guarantees. These assertions are enforced by `tsc`
   * (`pnpm typecheck`), not at runtime, so the test body is trivial.
   */
  test("rejects names absent from the schema", ({ assert }) => {
    class TestClass {
      // @ts-expect-error "document.xyz" is not a valid permission
      @CheckPermission("document.xyz")
      a() {}

      // @ts-expect-error "invoice" entity does not exist
      @CheckPermission("invoice.view")
      b() {}

      // @ts-expect-error "delete" is not a name in the schema
      @CheckPermission(["view", "delete"])
      c() {}
    }

    assert.isFunction(TestClass.prototype.a);
  });
});
