import "reflect-metadata";

import { test } from "@japa/runner";
import type { ExecutionContext } from "@nestjs/common";

import type { PermissionCheckResult } from "../src/interfaces.js";
import { CheckPermission, PermissionResult } from "../src/decorators.js";
import { PERMIFY_PERMISSION_KEY, PERMIFY_RESULT_KEY } from "../src/constant.js";

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

test.group("PermissionResult decorator", () => {
  function makeCtx(request: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => request })
    } as unknown as ExecutionContext;
  }

  test("returns results stored on request", ({ assert }) => {
    const stored: PermissionCheckResult[] = [
      { permission: "view", allowed: true },
      { permission: "edit", allowed: false }
    ];
    const mockRequest: Record<string, unknown> = {
      [PERMIFY_RESULT_KEY]: stored
    };
    const ctx = makeCtx(mockRequest);

    class C {
      handler(@PermissionResult() _r: PermissionCheckResult[]) {}
    }
    const argsMetadata =
      (Reflect.getMetadata("__routeArguments__", C, "handler") as Record<
        string,
        any
      >) ?? {};
    const factory = Object.values(argsMetadata)[0]?.factory;
    assert.isFunction(
      factory,
      "Expected NestJS to register param decorator factory"
    );

    const result = factory(undefined, ctx) as PermissionCheckResult[];
    assert.deepEqual(result, stored);
  });

  test("returns empty array when no guard ran", ({ assert }) => {
    const mockRequest: Record<string, unknown> = {};
    const ctx = makeCtx(mockRequest);

    class C {
      handler(@PermissionResult() _r: PermissionCheckResult[]) {}
    }
    const argsMetadata =
      (Reflect.getMetadata("__routeArguments__", C, "handler") as Record<
        string,
        any
      >) ?? {};
    const factory = Object.values(argsMetadata)[0]?.factory;
    assert.isFunction(
      factory,
      "Expected NestJS to register param decorator factory"
    );

    const result = factory(undefined, ctx) as PermissionCheckResult[];
    assert.deepEqual(result, []);
  });
});
