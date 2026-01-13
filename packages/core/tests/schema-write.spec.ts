import { test } from "@japa/runner";
import {
  schema,
  entity,
  relation,
  attribute,
  permission,
  relationsOf
} from "@permify-toolkit/core";

test.group("Schema validation and compilation", () => {
  test("should validate and compile a simple schema to Permify DSL", ({
    assert
  }) => {
    const definitions = schema({
      organization: entity({
        relations: {
          member: relation("user")
        },
        permissions: {
          view: permission("member")
        }
      }),
      user: entity({})
    });

    const dsl = definitions.compile();

    assert.isString(dsl);
    assert.include(dsl, "entity organization");
    assert.include(dsl, "relation member @user");
    assert.include(dsl, "permission view = member");
    assert.include(dsl, "entity user");
  });

  test("should validate relations reference existing entities", ({
    assert
  }) => {
    assert.throws(() => {
      schema({
        organization: entity({
          relations: {
            owner: relation("nonexistent")
          }
        })
      });
    }, 'Entity "nonexistent" referenced in relation "organization.owner" does not exist');
  });

  test("should validate permission reference existing relations or permission", ({
    assert
  }) => {
    assert.throws(() => {
      schema({
        organization: entity({
          relations: {
            member: relation("user")
          },
          permissions: {
            view: permission("nonexistent")
          }
        }),
        user: entity({})
      });
    }, 'Permission "organization.view" references undefined relation or permission "nonexistent"');
  });

  test("should compile schema with union permission", ({ assert }) => {
    const definitions = schema({
      document: entity({
        relations: {
          owner: relation("user"),
          editor: relation("user")
        },
        permissions: {
          edit: permission("owner or editor")
        }
      }),
      user: entity({})
    });

    const dsl = definitions.compile();

    assert.include(dsl, "permission edit = owner or editor");
  });

  test("should compile schema with intersection permission", ({ assert }) => {
    const definitions = schema({
      document: entity({
        relations: {
          member: relation("user"),
          approved: relation("user")
        },
        permissions: {
          view: permission("member and approved")
        }
      }),
      user: entity({})
    });

    const dsl = definitions.compile();

    assert.include(dsl, "permission view = member and approved");
  });

  test("should compile schema with nested relation references", ({
    assert
  }) => {
    const definitions = schema({
      document: entity({
        relations: {
          parent: relation("folder")
        },
        permissions: {
          view: permission("parent.view")
        }
      }),
      folder: entity({
        relations: {
          member: relation("user")
        },
        permissions: {
          view: permission("member")
        }
      }),
      user: entity({})
    });

    const dsl = definitions.compile();

    assert.include(dsl, "permission view = parent.view");
  });

  test("should validate nested relation targets exist", ({ assert }) => {
    assert.throws(() => {
      schema({
        document: entity({
          relations: {
            parent: relation("folder")
          },
          permissions: {
            view: permission("parent.nonexistent")
          }
        }),
        folder: entity({
          relations: {
            member: relation("user")
          }
        }),
        user: entity({})
      });
    }, 'Permission "document.view" references undefined permission or relation "nonexistent" on entity "folder"');
  });

  test("should compile complex real-world schema", ({ assert }) => {
    const definitions = schema({
      organization: entity({
        relations: {
          admin: relation("user"),
          member: relation("user")
        },
        permissions: {
          create_repo: permission("admin"),
          view: permission("admin or member")
        }
      }),
      repository: entity({
        relations: {
          org: relation("organization"),
          maintainer: relation("user")
        },
        permissions: {
          push: permission("maintainer or org.admin"),
          view: permission("maintainer or org.view")
        }
      }),
      user: entity({})
    });

    const dsl = definitions.compile();

    assert.include(dsl, "entity organization");
    assert.include(dsl, "entity repository");
    assert.include(dsl, "entity user");
    assert.include(dsl, "permission push = maintainer or org.admin");
    assert.include(dsl, "permission view = maintainer or org.view");
  });

  test("should provide typed permission strings", ({ assert }) => {
    const definitions = schema({
      document: entity({
        relations: {
          owner: relation("user")
        },
        permissions: {
          view: permission("owner"),
          edit: permission("owner"),
          delete: permission("owner")
        }
      }),
      user: entity({})
    });

    // These should be type-safe at compile time
    const viewPerm = definitions.permissions.document.view;
    const editPerm = definitions.permissions.document.edit;
    const deletePerm = definitions.permissions.document.delete;

    assert.equal(viewPerm, "document:view");
    assert.equal(editPerm, "document:edit");
    assert.equal(deletePerm, "document:delete");
  });

  test("should compile complex real-world schema with attributes", ({
    assert
  }) => {
    const definitions = schema({
      role: entity({
        attributes: {
          name: attribute("string")
        }
      }),
      dashboard: entity({
        relations: {
          viewers: relation("role")
        },
        permissions: {
          read: permission("viewers")
        }
      }),
      customer: entity({
        relations: {
          viewers: relation("role")
        },
        permissions: {
          read: permission("viewers")
        }
      }),
      recording: entity({
        relations: {
          viewers: relation("role")
        },
        permissions: {
          read: permission("viewers")
        }
      }),
      attachment: entity({
        relations: relationsOf("role", ["viewers", "creators", "downloaders"]),
        permissions: {
          read: permission("viewers or downloaders"),
          download: permission("downloaders")
        }
      }),
      block: entity({
        relations: {
          viewers: relation("role"),
          updaters: relation("role")
        },
        permissions: {
          read: permission("viewers or updaters"),
          update: permission("updaters")
        }
      })
    });

    const dsl = definitions.compile();

    assert.include(dsl, "entity role");
    assert.include(dsl, "attribute name string");
    assert.include(dsl, "entity dashboard");
    assert.include(dsl, "relation viewers @role");
    assert.include(dsl, "permission read = viewers");
    assert.include(dsl, "entity attachment");
    assert.include(dsl, "permission read = viewers or downloaders");
    assert.include(dsl, "permission download = downloaders");
  });

  test("should throw error if entity definition is not an object", ({
    assert
  }) => {
    assert.throws(() => {
      schema({
        // @ts-ignore - Runtime check test
        user: "invalid-definition"
      });
    }, 'Entity definition for "user" must be an object');
  });
});
