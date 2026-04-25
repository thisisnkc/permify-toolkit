---
sidebar_position: 5
---

# VS Code Extension

The Permify Toolkit VS Code extension adds editor support for `.perm` authorization schema files.

It is a fork of the official [`Permify/vscode-perm`](https://github.com/Permify/vscode-perm) extension. The original provides syntax highlighting and snippets, both are preserved with a live diagnostic engine layered on top.

## Installation

Search **Permify Toolkit** in the VS Code Extensions panel, or install from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=Permify.perm).

## Features

### Syntax Highlighting

`.perm` files are fully tokenized, keywords (`entity`, `relation`, `permission`, `attribute`), identifiers, operators, and comments are colored correctly in any VS Code theme.

### Code Snippets

Snippets for common schema patterns let you scaffold entity blocks and relation/permission declarations quickly.

### Live Diagnostics

As you type, open, or save a `.perm` file the extension validates the schema and underlines problems inline, no build step, no external tool required.

**Errors** are reported for:

- Malformed `entity`, `relation`, `permission`, and `attribute` declarations
- Unexpected top-level statements and stray closing braces
- Unclosed entity blocks
- Duplicate entity, relation, permission, or attribute names
- Missing or invalid relation target syntax
- References to undefined entities in relation targets
- References to undefined local relations or permissions in permission expressions
- Undefined nested references (e.g. `parent.edit` where `edit` is not defined on the target)
- Missing operators in permission expressions
- Unbalanced parentheses
- Permission cycles
- Empty schemas

**Warnings** are reported for:

- Entities that are empty and unreferenced
- Entities that define relations but declare no permissions
- Relations that are never used in any permission expression

All diagnostics resolve to exact source ranges, the squiggle lands on the specific name, keyword, or expression that caused the problem.

### File Icon

`.perm` files display the Permify logo in the Explorer sidebar. No icon theme switch required on VS Code 1.79+.

## Usage

Open any `.perm` file and the extension activates automatically. Diagnostics appear inline and in the Problems panel (`Ctrl+Shift+M` / `Cmd+Shift+M`).

![VS Code Extension Output](/img/vscode-extension-output.png)

## How It Works

The diagnostic engine is powered by `@permify-toolkit/core`, which exposes a text-to-AST parser and a structured diagnostics API. The extension calls into core on every file open, save, and change, no external process or language server required.
