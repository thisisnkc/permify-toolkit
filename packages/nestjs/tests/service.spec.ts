import { test } from "@japa/runner";
import { Reflector } from "@nestjs/core";

import { PermifyService } from "../src/service.js";

test.group("PermifyService.evaluatePermissions", () => {
  const getMockOptions = (_clientMock: any) => ({
    client: { endpoint: "localhost:3478" } // Minimal options for instantiation
  });

  const getService = (clientMock: any) => {
    // Override the constructor-created client
    const service = new PermifyService(
      getMockOptions(clientMock),
      new Reflector()
    );
    (service as any).client = clientMock;
    return service;
  };

  test("single permission evaluation", async ({ assert }) => {
    let callCount = 0;
    const clientMock = {
      permission: {
        check: async (_params: any) => {
          callCount++;
          return { can: 1 }; // ALLOWED
        }
      }
    };
    const service = getService(clientMock);

    const result = await service.evaluatePermissions({
      tenantId: "t1",
      subject: { type: "user", id: "u1" },
      checks: [{ entity: { type: "document", id: "d1" }, permission: "view" }]
    });

    assert.deepEqual(result, [{ permission: "view", allowed: true }]);
    assert.equal(callCount, 1);
  });

  test("executes multiple permission checks", async ({ assert }) => {
    let callCount = 0;
    const clientMock = {
      permission: {
        check: async (_params: any) => {
          callCount++;
          return { can: 1 };
        }
      }
    };
    const service = getService(clientMock);

    const result = await service.evaluatePermissions({
      tenantId: "t1",
      subject: { type: "user", id: "u1" },
      checks: [
        { entity: { type: "document", id: "d1" }, permission: "view" },
        { entity: { type: "document", id: "d1" }, permission: "edit" }
      ]
    });

    assert.equal(callCount, 2);
    assert.lengthOf(result, 2);
  });

  test("returns structured results", async ({ assert }) => {
    const clientMock = {
      permission: {
        check: async (params: any) => {
          if (params.permission === "view") return { can: 1 };
          if (params.permission === "edit") return { can: 2 };
          return { can: 2 };
        }
      }
    };
    const service = getService(clientMock);

    const result = await service.evaluatePermissions({
      tenantId: "t1",
      subject: { type: "user", id: "u1" },
      checks: [
        { entity: { type: "document", id: "d1" }, permission: "view" },
        { entity: { type: "document", id: "d1" }, permission: "edit" }
      ]
    });

    assert.deepEqual(result, [
      { permission: "view", allowed: true },
      { permission: "edit", allowed: false }
    ]);
  });

  test("propagates client errors", async ({ assert }) => {
    const clientMock = {
      permission: {
        check: async (_params: any) => {
          throw new Error("gRPC error: server unavailable");
        }
      }
    };
    const service = getService(clientMock);

    await assert.rejects(
      () =>
        service.evaluatePermissions({
          tenantId: "t1",
          subject: { type: "user", id: "u1" },
          checks: [
            { entity: { type: "document", id: "d1" }, permission: "view" }
          ]
        }),
      "gRPC error: server unavailable"
    );
  });

  test("runs permission checks concurrently (optional concurrent test)", async ({
    assert
  }) => {
    let callCount = 0;
    const clientMock = {
      permission: {
        check: async (_params: any) => {
          callCount++;
          return new Promise((resolve) =>
            setTimeout(() => resolve({ can: 1 }), 50)
          );
        }
      }
    };
    const service = getService(clientMock);

    const start = Date.now();
    await service.evaluatePermissions({
      tenantId: "t1",
      subject: { type: "user", id: "u1" },
      checks: [
        { entity: { type: "document", id: "d1" }, permission: "view" },
        { entity: { type: "document", id: "d1" }, permission: "edit" }
      ]
    });
    const duration = Date.now() - start;

    assert.equal(callCount, 2);
    // 50ms total means they ran in parallel (if sequential it would be ~100ms)
    assert.isBelow(
      duration,
      90,
      "Expected parallel execution duration to be lower than sequential"
    );
  });
});
