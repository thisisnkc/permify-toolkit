import { test } from "@japa/runner";
import { defineSchema } from "@permify-toolkit/core";

test.group("Schema validation and compilation", () => {
  test("should validate and compile a simple schema to Permify DSL", ({
    assert
  }) => {
    const schema = defineSchema({
      organization: {
        relations: {
          member: ["user"]
        },
        permission: {
          view: "member"
        }
      },
      user: {}
    });

    const dsl = schema.compile();

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
      defineSchema({
        organization: {
          relations: {
            owner: ["nonexistent"]
          }
        }
      });
    }, 'Entity "nonexistent" referenced in relation "organization.owner" does not exist');
  });

  test("should validate permission reference existing relations or permission", ({
    assert
  }) => {
    assert.throws(() => {
      defineSchema({
        organization: {
          relations: {
            member: ["user"]
          },
          permission: {
            view: "nonexistent"
          }
        },
        user: {}
      });
    }, 'Permission "organization.view" references undefined relation or permission "nonexistent"');
  });

  test("should compile schema with union permission", ({ assert }) => {
    const schema = defineSchema({
      document: {
        relations: {
          owner: ["user"],
          editor: ["user"]
        },
        permission: {
          edit: "owner or editor"
        }
      },
      user: {}
    });

    const dsl = schema.compile();

    assert.include(dsl, "permission edit = owner or editor");
  });

  test("should compile schema with intersection permission", ({ assert }) => {
    const schema = defineSchema({
      document: {
        relations: {
          member: ["user"],
          approved: ["user"]
        },
        permission: {
          view: "member and approved"
        }
      },
      user: {}
    });

    const dsl = schema.compile();

    assert.include(dsl, "permission view = member and approved");
  });

  test("should compile schema with nested relation references", ({
    assert
  }) => {
    const schema = defineSchema({
      document: {
        relations: {
          parent: ["folder"]
        },
        permission: {
          view: "parent.view"
        }
      },
      folder: {
        relations: {
          member: ["user"]
        },
        permission: {
          view: "member"
        }
      },
      user: {}
    });

    const dsl = schema.compile();

    assert.include(dsl, "permission view = parent.view");
  });

  test("should validate nested relation targets exist", ({ assert }) => {
    assert.throws(() => {
      defineSchema({
        document: {
          relations: {
            parent: ["folder"]
          },
          permission: {
            view: "parent.nonexistent"
          }
        },
        folder: {
          relations: {
            member: ["user"]
          }
        },
        user: {}
      });
    }, 'Permission "document.view" references undefined permission or relation "nonexistent" on entity "folder"');
  });

  test("should compile complex real-world schema", ({ assert }) => {
    const schema = defineSchema({
      organization: {
        relations: {
          admin: ["user"],
          member: ["user"]
        },
        permission: {
          create_repo: "admin",
          view: "admin or member"
        }
      },
      repository: {
        relations: {
          org: ["organization"],
          maintainer: ["user"]
        },
        permission: {
          push: "maintainer or org.admin",
          view: "maintainer or org.view"
        }
      },
      user: {}
    });

    const dsl = schema.compile();

    assert.include(dsl, "entity organization");
    assert.include(dsl, "entity repository");
    assert.include(dsl, "entity user");
    assert.include(dsl, "permission push = maintainer or org.admin");
    assert.include(dsl, "permission view = maintainer or org.view");
  });

  test("should provide typed permission strings", ({ assert }) => {
    const schema = defineSchema({
      document: {
        relations: {
          owner: ["user"]
        },
        permission: {
          view: "owner",
          edit: "owner",
          delete: "owner"
        }
      },
      user: {}
    });

    // These should be type-safe at compile time
    const viewPerm = schema.permission.document.view;
    const editPerm = schema.permission.document.edit;
    const deletePerm = schema.permission.document.delete;

    assert.equal(viewPerm, "document:view");
    assert.equal(editPerm, "document:edit");
    assert.equal(deletePerm, "document:delete");
  });
  test("should compile complex real-world schema with attributes", ({
    assert
  }) => {
    const schema = defineSchema({
      role: {
        attributes: {
          name: "string"
        }
      },
      dashboard: {
        relations: {
          viewers: ["role"]
        },
        permission: {
          read: "viewers"
        }
      },
      customer: {
        relations: {
          viewers: ["role"]
        },
        permission: {
          read: "viewers"
        }
      },
      recording: {
        relations: {
          viewers: ["role"]
        },
        permission: {
          read: "viewers"
        }
      },
      attachment: {
        relations: {
          viewers: ["role"],
          downloaders: ["role"]
        },
        permission: {
          read: "viewers or downloaders",
          download: "downloaders"
        }
      },
      block: {
        relations: {
          viewers: ["role"],
          updaters: ["role"]
        },
        permission: {
          read: "viewers or updaters",
          update: "updaters"
        }
      }
    });

    const dsl = schema.compile();

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
      defineSchema({
        // @ts-ignore - Runtime check test
        user: "invalid-definition"
      });
    }, 'Entity definition for "user" must be an object');
  });

  test("should throw error if entity definition is not an object", ({
    assert
  }) => {
    assert.throws(() => {
      try {
        defineSchema({
          role: {
            attributes: {
              name: "string"
            }
          },
          attachment: {
            relations: {
              viewers: ["role"],
              downloaders: ["role"]
            },
            permission: {
              read: "viewers union downloaders",
              download: "downloaders"
            }
          }
        });
      } catch (error) {
        console.error("Error caught:", error);
        throw error;
      }
    });
  });
});
