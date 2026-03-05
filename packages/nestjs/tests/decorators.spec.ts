import "reflect-metadata";

import { test } from "@japa/runner";

import { CheckPermission } from "../src/decorators.js";
import { PERMIFY_PERMISSION_KEY } from "../src/constant.js";

test.group("CheckPermission decorator", () => {
  const getMetadata = (target: any) =>
    Reflect.getMetadata(PERMIFY_PERMISSION_KEY, target);

  test("normalizes single permission string", ({ assert }) => {
    class TestClass {
      @CheckPermission("document.view")
      method() {}
    }

    const metadata = getMetadata(TestClass.prototype.method);
    assert.deepEqual(metadata.permissions, ["document.view"]);
    assert.equal(metadata.mode, "AND");
  });

  test("accepts array of permissions", ({ assert }) => {
    class TestClass {
      @CheckPermission(["document.view", "document.edit"])
      method() {}
    }

    const metadata = getMetadata(TestClass.prototype.method);
    assert.deepEqual(metadata.permissions, ["document.view", "document.edit"]);
    assert.equal(metadata.mode, "AND");
  });

  test("supports OR mode", ({ assert }) => {
    class TestClass {
      @CheckPermission(["document.view", "document.edit"], { mode: "OR" })
      method() {}
    }

    const metadata = getMetadata(TestClass.prototype.method);
    assert.deepEqual(metadata.permissions, ["document.view", "document.edit"]);
    assert.equal(metadata.mode, "OR");
  });

  test("throws if permissions array is empty", ({ assert }) => {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class TestClass {
        @CheckPermission([])
        method() {}
      }
    }, "CheckPermission decorator requires at least one permission string.");
  });

  test("throws if mode is invalid", ({ assert }) => {
    assert.throws(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class TestClass {
        // @ts-expect-error Testing runtime validation
        @CheckPermission(["document.view"], { mode: "INVALID" })
        method() {}
      }
    }, "Invalid permission mode 'INVALID'. Expected 'AND' or 'OR'.");
  });
});
