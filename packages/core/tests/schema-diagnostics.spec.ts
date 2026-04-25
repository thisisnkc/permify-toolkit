import "@japa/assert";

import { test } from "@japa/runner";
import {
  getSchemaDiagnostics,
  parseSchema,
  parseSchemaWithDiagnostics,
  validateSchema
} from "@permify-toolkit/core";

test.group("Schema text parsing", () => {
  test("parses valid perm schema text with comments and multiple relation targets", ({
    assert
  }) => {
    const ast = parseSchema(`
entity user {}

entity organization {
  relation admin @user
  relation member @user
  permission view = admin or member
}

// comment
entity repository {
  relation owner @user @organization#member
  relation parent @organization
  permission push = owner
  permission read = owner and (parent.view and not parent.member)
}
`);

    assert.exists(ast.entities.user);
    assert.deepEqual(ast.entities.repository.relations.owner.target, [
      "user",
      "organization#member"
    ]);
    assert.equal(
      ast.entities.repository.permissions.read.expression,
      "owner and (parent.view and not parent.member)"
    );
  });

  test("returns syntax diagnostics for malformed entities", ({ assert }) => {
    const result = parseSchemaWithDiagnostics(`
entity user
`);

    assert.isTrue(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "invalid-entity"
      )
    );
  });
});

test.group("Schema diagnostics", () => {
  test("reports undefined entity targets and undefined permission references", ({
    assert
  }) => {
    const diagnostics = getSchemaDiagnostics(`
entity document {
  relation owner @account
  permission view = owner or editor
}
`);

    assert.isTrue(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "undefined-entity" &&
          diagnostic.message.includes('"account"')
      )
    );
    assert.isTrue(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "undefined-reference" &&
          diagnostic.message.includes('"editor"')
      )
    );
  });

  test("reports invalid nested references with source locations", ({
    assert
  }) => {
    const diagnostics = getSchemaDiagnostics(`
entity user {}

entity folder {
  relation member @user
}

entity document {
  relation parent @folder
  permission view = parent.edit
}
`);

    const diagnostic = diagnostics.find(
      (item) => item.code === "undefined-nested-reference"
    );

    assert.exists(diagnostic);
    assert.equal(diagnostic?.location?.start.line, 10);
    assert.include(diagnostic?.message ?? "", '"edit"');
  });

  test("keeps warnings visible even when parse errors exist", ({ assert }) => {
    const diagnostics = getSchemaDiagnostics(`
permission stray = owner

entity user {}

entity document {
  relation owner @user
  relation viewer @user
  permission view = owner
}
`);

    assert.isTrue(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "unexpected-top-level-token" &&
          diagnostic.severity === "error"
      )
    );
    assert.isTrue(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "unused-relation" &&
          diagnostic.message.includes('relation "viewer" is never used')
      )
    );
  });

  test("emits warning locations for entity and relation warnings", ({
    assert
  }) => {
    const diagnostics = getSchemaDiagnostics(`
entity orphan {}

entity user {}

entity document {
  relation owner @user
  relation viewer @user
  permission view = owner
}
`);

    const orphanWarning = diagnostics.find(
      (diagnostic) => diagnostic.code === "empty-unreferenced-entity"
    );
    const viewerWarning = diagnostics.find(
      (diagnostic) => diagnostic.code === "unused-relation"
    );

    assert.exists(orphanWarning);
    assert.equal(orphanWarning?.location?.start.line, 2);
    assert.exists(viewerWarning);
    assert.equal(viewerWarning?.location?.start.line, 8);
    assert.equal(viewerWarning?.location?.start.column, 12);
  });
});

test.group("Validation compatibility", () => {
  test("keeps validateSchema throw semantics for existing AST callers", ({
    assert
  }) => {
    assert.throws(() => {
      validateSchema({
        entities: {
          user: {
            name: "user",
            relations: {},
            permissions: {},
            attributes: {}
          },
          document: {
            name: "document",
            relations: {
              owner: {
                name: "owner",
                target: ["user"]
              }
            },
            permissions: {
              view: {
                name: "view",
                expression: "missing"
              }
            },
            attributes: {}
          }
        }
      });
    }, 'Permission "document.view" references undefined relation or permission "missing"');
  });
});
