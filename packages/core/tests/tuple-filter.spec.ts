import "@japa/assert";

import { test } from "@japa/runner";
import { tupleFilter } from "@permify-toolkit/core";

test.group("tupleFilter", () => {
  test("fills defaults for an empty input", ({ assert }) => {
    assert.deepEqual(tupleFilter(), {
      entity: { type: "", ids: [] },
      relation: "",
      subject: { type: "", ids: [], relation: "" }
    });
  });

  test("preserves entity type and fills missing ids", ({ assert }) => {
    assert.deepEqual(tupleFilter({ entity: { type: "document" } }), {
      entity: { type: "document", ids: [] },
      relation: "",
      subject: { type: "", ids: [], relation: "" }
    });
  });

  test("normalizes a partial subject filter", ({ assert }) => {
    const out = tupleFilter({
      entity: { type: "document", ids: ["d1"] },
      relation: "viewer",
      subject: { type: "user", ids: ["u1"] }
    });
    assert.deepEqual(out, {
      entity: { type: "document", ids: ["d1"] },
      relation: "viewer",
      subject: { type: "user", ids: ["u1"], relation: "" }
    });
  });
});
