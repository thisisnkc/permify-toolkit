# Contributing to Permify Toolkit

First off, thanks for taking the time to contribute! ❤️

All types of contributions are encouraged and valued. See the [Table of Contents](#table-of-contents) for different ways to help and details about how this project handles them. Please make sure to read the relevant section before making your contribution. It will make it a lot easier for us maintainers and smooth out the experience for all involved. The community looks forward to your contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Improving The Documentation](#improving-the-documentation)
- [Styleguides](#styleguides)
  - [Branch Naming](#branch-naming)
  - [Commit Messages](#commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by the [Permify Toolkit Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## I Have a Question

> If you want to ask a question, we assume that you have read the available [Documentation](https://github.com/thisisnkc/permify-toolkit#readme).

Before you ask a question, it is best to search for existing [Issues](https://github.com/thisisnkc/permify-toolkit/issues) that might help you. In case you have found a suitable issue and still need clarification, you can write your question in this issue. It is also advisable to search the internet for answers first.

## I Want To Contribute

### Reporting Bugs

Specifying valid information content for bug reports helps us to address issues ASAP. Please search existing issues before filing a new one.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Permify Toolkit, **including completely new features and minor improvements to existing functionality**. Following these guidelines will help maintainers and the community to understand your suggestion and find related suggestions.

### Your First Code Contribution

#### Prerequisites

- [Node.js](https://nodejs.org/) (check `.nvmrc` or `package.json` for version)
- [pnpm](https://pnpm.io/)

#### Local Setup

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/<your-username>/permify-toolkit.git
    cd permify-toolkit
    ```
3.  **Install dependencies**:
    ```bash
    pnpm install
    ```

#### Development Workflow

1.  **Create a branch** for your changes. Use descriptive names with prefixes (see [Branch Naming](#branch-naming)):
    ```bash
    git checkout -b feat/my-new-feature
    ```

This is a **monorepo** managed with `pnpm` workspaces. Packages are located in the `packages/` directory.

- **Build all packages**:

  ```bash
  pnpm build
  ```

- **Run development mode**:

  ```bash
  pnpm dev
  ```

- **Linting**:

  ```bash
  pnpm lint
  ```

- **Testing**:
  ```bash
  pnpm test
  ```

### Versioning & Changesets

We use [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

If your pull request contains a change that should be released (e.g., a bug fix, new feature, or breaking change), you **must** include a changeset file.

1.  Run the changeset command:
    ```bash
    pnpm changeset
    ```
2.  Follow the interactive prompts to select the changed packages and semver bump type (major, minor, or patch).
3.  Write a summary of the changes.

This will create a new Markdown file in the `.changeset` directory. Commit this file along with your code changes.

## Styleguides

### Branch Naming

We use a prefix-based branch naming convention to keep our repository organized:

- `feat/`: New features (e.g., `feat/add-cli-command`)
- `fix/`: Bug fixes (e.g., `fix/client-timeout`)
- `docs/`: Documentation updates (e.g., `docs/update-readme`)
- `chore/`: Maintenance tasks, dependencies, etc. (e.g., `chore/bump-deps`)
- `refactor/`: Code improvements that don't change functionality (e.g., `refactor/api-client`)
- `test/`: Adding or improving tests (e.g., `test/core-client`)

### Commit Messages

We encourage following [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages.

```
<type>: <description>

[optional body]
```

Examples:

- `feat: add new CLI command`
- `fix: resolve crash on startup`
- `docs: update readme`
