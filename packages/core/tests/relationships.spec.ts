import "@japa/assert";

import { test } from "@japa/runner";
import {
  writeRelationships,
  deleteRelationships,
  type Relationship
} from "@permify-toolkit/core";

interface FakeWriteCall {
  tenantId: string;
  tuples: Relationship[];
}

interface FakeDeleteCall {
  tenantId: string;
  filter: any;
}

function makeFakeClient() {
  const writes: FakeWriteCall[] = [];
  const deletes: FakeDeleteCall[] = [];
  return {
    writes,
    deletes,
    tenancy: {
      list: async () => ({ tenants: [{ id: "t1" }] }),
      create: async () => ({}),
      delete: async () => ({})
    },
    data: {
      write: async (req: any) => {
        writes.push({ tenantId: req.tenantId, tuples: req.tuples });
      },
      delete: async (req: any) => {
        deletes.push({ tenantId: req.tenantId, filter: req.filter });
      }
    }
  };
}

const sampleTuple: Relationship = {
  entity: { type: "document", id: "d1" },
  relation: "owner",
  subject: { type: "user", id: "u1" }
};

test.group("writeRelationships", () => {
  test("accepts flat tuples shape", async ({ assert }) => {
    const client = makeFakeClient();
    const result = await writeRelationships({
      client,
      tenantId: "t1",
      tuples: [sampleTuple]
    });
    assert.equal(result.success, true);
    assert.equal(result.count, 1);
    assert.deepEqual(client.writes[0].tuples, [sampleTuple]);
  });

  test("still accepts nested relationships shape", async ({ assert }) => {
    const client = makeFakeClient();
    const result = await writeRelationships({
      client,
      tenantId: "t1",
      relationships: { tuples: [sampleTuple] }
    });
    assert.equal(result.count, 1);
  });

  test("works without endpoint when client is provided", async ({ assert }) => {
    const client = makeFakeClient();
    const result = await writeRelationships({
      client,
      tenantId: "t1",
      tuples: [sampleTuple]
    });
    assert.equal(result.success, true);
  });
});

test.group("deleteRelationships", () => {
  test("normalizes an empty filter to gRPC defaults", async ({ assert }) => {
    const client = makeFakeClient();
    await deleteRelationships({
      client,
      tenantId: "t1",
      filter: {}
    });
    assert.deepEqual(client.deletes[0].filter, {
      entity: { type: "", ids: [] },
      relation: "",
      subject: { type: "", ids: [], relation: "" }
    });
  });

  test("normalizes a partial entity-only filter", async ({ assert }) => {
    const client = makeFakeClient();
    await deleteRelationships({
      client,
      tenantId: "t1",
      filter: { entity: { type: "document" } }
    });
    assert.equal(client.deletes[0].filter.entity.type, "document");
    assert.deepEqual(client.deletes[0].filter.entity.ids, []);
  });
});
