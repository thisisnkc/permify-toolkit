import "@japa/assert";

import { test } from "@japa/runner";

import { diffSchema, textDiff } from "../src/schema/diff-schema.js";
import type { SchemaEntityMap } from "../src/schema/read-schema.js";

// --- helpers ---

function emptyMap(): SchemaEntityMap {
  return {};
}

function singleEntity(
  name: string,
  relations: Record<string, string> = {},
  permissions: Record<string, string> = {}
): SchemaEntityMap {
  return { [name]: { relations, permissions } };
}

// --- diffSchema ---

test.group("diffSchema - identical schemas", () => {
  test("returns no changes for empty schemas", ({ assert }) => {
    const result = diffSchema(emptyMap(), emptyMap());
    assert.isFalse(result.hasChanges);
    assert.lengthOf(result.added, 0);
    assert.lengthOf(result.removed, 0);
    assert.lengthOf(result.modified, 0);
  });

  test("returns no changes when schemas match", ({ assert }) => {
    const map: SchemaEntityMap = {
      user: { relations: {}, permissions: {} },
      document: {
        relations: { owner: "@user" },
        permissions: { edit: "owner", view: "owner" }
      }
    };
    const result = diffSchema(map, map);
    assert.isFalse(result.hasChanges);
  });
});

test.group("diffSchema - added entities", () => {
  test("detects a new entity in local", ({ assert }) => {
    const local = singleEntity(
      "document",
      { owner: "@user" },
      { edit: "owner" }
    );
    const result = diffSchema(local, emptyMap());

    assert.isTrue(result.hasChanges);
    assert.lengthOf(result.added, 1);
    assert.equal(result.added[0].name, "document");
    assert.deepEqual(result.added[0].relations, { owner: "@user" });
    assert.deepEqual(result.added[0].permissions, { edit: "owner" });
    assert.lengthOf(result.removed, 0);
    assert.lengthOf(result.modified, 0);
  });

  test("detects multiple added entities", ({ assert }) => {
    const local: SchemaEntityMap = {
      user: { relations: {}, permissions: {} },
      document: { relations: { owner: "@user" }, permissions: {} }
    };
    const result = diffSchema(local, emptyMap());

    assert.isTrue(result.hasChanges);
    assert.lengthOf(result.added, 2);
  });
});

test.group("diffSchema - removed entities", () => {
  test("detects entity removed from local", ({ assert }) => {
    const remote = singleEntity(
      "team",
      { member: "@user" },
      { view: "member" }
    );
    const result = diffSchema(emptyMap(), remote);

    assert.isTrue(result.hasChanges);
    assert.lengthOf(result.removed, 1);
    assert.equal(result.removed[0].name, "team");
    assert.lengthOf(result.added, 0);
  });
});

test.group("diffSchema - modified entities", () => {
  test("detects added relation", ({ assert }) => {
    const local: SchemaEntityMap = {
      document: {
        relations: { owner: "@user", editor: "@user" },
        permissions: { edit: "owner" }
      }
    };
    const remote: SchemaEntityMap = {
      document: {
        relations: { owner: "@user" },
        permissions: { edit: "owner" }
      }
    };
    const result = diffSchema(local, remote);

    assert.isTrue(result.hasChanges);
    assert.lengthOf(result.modified, 1);
    assert.deepEqual(result.modified[0].relations.added, ["editor"]);
    assert.lengthOf(result.modified[0].relations.removed, 0);
    assert.lengthOf(result.modified[0].relations.changed, 0);
  });

  test("detects removed relation", ({ assert }) => {
    const local: SchemaEntityMap = {
      document: {
        relations: { owner: "@user" },
        permissions: {}
      }
    };
    const remote: SchemaEntityMap = {
      document: {
        relations: { owner: "@user", viewer: "@user" },
        permissions: {}
      }
    };
    const result = diffSchema(local, remote);

    assert.isTrue(result.hasChanges);
    assert.deepEqual(result.modified[0].relations.removed, ["viewer"]);
  });

  test("detects changed permission expression", ({ assert }) => {
    const local: SchemaEntityMap = {
      document: {
        relations: { owner: "@user" },
        permissions: { view: "owner or editor" }
      }
    };
    const remote: SchemaEntityMap = {
      document: {
        relations: { owner: "@user" },
        permissions: { view: "owner" }
      }
    };
    const result = diffSchema(local, remote);

    assert.isTrue(result.hasChanges);
    assert.lengthOf(result.modified, 1);
    assert.deepEqual(result.modified[0].permissions.changed, ["view"]);
    assert.lengthOf(result.modified[0].permissions.added, 0);
    assert.lengthOf(result.modified[0].permissions.removed, 0);
  });

  test("detects changed relation target", ({ assert }) => {
    const local: SchemaEntityMap = {
      document: {
        relations: { parent: "@folder" },
        permissions: {}
      }
    };
    const remote: SchemaEntityMap = {
      document: {
        relations: { parent: "@organization" },
        permissions: {}
      }
    };
    const result = diffSchema(local, remote);

    assert.isTrue(result.hasChanges);
    assert.deepEqual(result.modified[0].relations.changed, ["parent"]);
  });

  test("does not flag entity as modified when contents match", ({ assert }) => {
    const map: SchemaEntityMap = {
      document: {
        relations: { owner: "@user" },
        permissions: { edit: "owner" }
      }
    };
    const result = diffSchema(map, { ...map });
    assert.isFalse(result.hasChanges);
    assert.lengthOf(result.modified, 0);
  });
});

test.group("diffSchema - mixed changes", () => {
  test("handles added, removed, and modified entities together", ({
    assert
  }) => {
    const local: SchemaEntityMap = {
      user: { relations: { manager: "@user" }, permissions: {} },
      document: {
        relations: { owner: "@user", viewer: "@user" },
        permissions: { edit: "owner" }
      },
      school: {
        relations: { teacher: "@user" },
        permissions: { teach: "teacher" }
      }
    };
    const remote: SchemaEntityMap = {
      user: { relations: {}, permissions: {} },
      document: {
        relations: { owner: "@user", parent: "@organization" },
        permissions: { edit: "owner" }
      },
      organization: {
        relations: { member: "@user" },
        permissions: { view: "member" }
      }
    };
    const result = diffSchema(local, remote);

    assert.isTrue(result.hasChanges);
    assert.lengthOf(result.added, 1);
    assert.equal(result.added[0].name, "school");
    assert.lengthOf(result.removed, 1);
    assert.equal(result.removed[0].name, "organization");
    assert.lengthOf(result.modified, 2);

    const userMod = result.modified.find((m) => m.name === "user")!;
    assert.deepEqual(userMod.relations.added, ["manager"]);

    const docMod = result.modified.find((m) => m.name === "document")!;
    assert.deepEqual(docMod.relations.added, ["viewer"]);
    assert.deepEqual(docMod.relations.removed, ["parent"]);
  });
});

// --- textDiff ---

test.group("textDiff - identical content", () => {
  test("returns empty string for identical inputs", ({ assert }) => {
    const dsl =
      "entity user {}\n\nentity document {\n    relation owner @user\n}";
    const result = textDiff(dsl, dsl, "local", "remote");
    assert.equal(result, "");
  });
});

test.group("textDiff - additions", () => {
  test("shows added lines with + prefix", ({ assert }) => {
    const remote = "entity user {}";
    const local =
      "entity user {}\n\nentity document {\n    relation owner @user\n}";
    const result = textDiff(local, remote, "local", "remote");

    assert.include(result, "--- remote");
    assert.include(result, "+++ local");
    assert.include(result, "+entity document {");
    assert.include(result, "+    relation owner @user");
  });
});

test.group("textDiff - removals", () => {
  test("shows removed lines with - prefix", ({ assert }) => {
    const remote =
      "entity user {}\n\nentity team {\n    relation member @user\n}";
    const local = "entity user {}";
    const result = textDiff(local, remote, "local", "remote");

    assert.include(result, "-entity team {");
    assert.include(result, "-    relation member @user");
  });
});

test.group("textDiff - modifications", () => {
  test("shows changed lines as removal + addition", ({ assert }) => {
    const remote = "entity document {\n    permission view = owner\n}";
    const local = "entity document {\n    permission view = owner or editor\n}";
    const result = textDiff(local, remote, "local", "remote");

    assert.include(result, "-    permission view = owner");
    assert.include(result, "+    permission view = owner or editor");
  });
});

test.group("textDiff - hunk headers", () => {
  test("includes @@ hunk headers", ({ assert }) => {
    const remote = "entity user {}";
    const local = "entity user {}\nentity doc {}";
    const result = textDiff(local, remote, "local", "remote");

    assert.match(result, /@@\s+-\d+,\d+\s+\+\d+,\d+\s+@@/);
  });
});
