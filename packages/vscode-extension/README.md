# Permify Toolkit — VS Code Extension

VS Code language support for `.perm` authorization schema files.

This extension is a fork of [`Permify/vscode-perm`](https://github.com/Permify/vscode-perm) — it preserves the original syntax highlighting and snippets, and adds a live diagnostic engine powered by `@permify-toolkit/core`.

## Features

- **Syntax highlighting** — keywords, identifiers, operators, and comments tokenized for any theme
- **Code snippets** — scaffold entity blocks and declarations quickly
- **Live diagnostics** — errors and warnings as you type, with squiggles on exact source locations
- **File icon** — Permify logo on `.perm` files in the Explorer sidebar

### What gets caught

**Errors:** undefined entity/relation/permission references, duplicate declarations, syntax problems, permission cycles, unbalanced parentheses, and more.

**Warnings:** empty unreferenced entities, entities with relations but no permissions, unused relations.

## Usage

Open any `.perm` file — the extension activates automatically. Diagnostics appear inline and in the Problems panel (`Ctrl+Shift+M` / `Cmd+Shift+M`).

```perm
entity user {}

entity organization {
    relation admin  @user
    relation member @user

    permission create_repository = admin or member
    permission delete             = admin
}

entity repository {
    relation owner  @user @organization#member
    relation parent @organization

    permission push   = owner
    permission read   = owner and (parent.admin and not parent.member)
    permission delete = parent.member and (parent.admin or owner)
}
```

## Installation

Search **Permify Toolkit** in the Extensions panel or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Permify.perm).

## Links

- [Permify](https://permify.co)
- [Upstream extension](https://github.com/Permify/vscode-perm)
- [permify-toolkit monorepo](https://github.com/thisisnkc/permify-toolkit)
