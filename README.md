# Permify Toolkit

![License](https://img.shields.io/github/license/thisisnkc/permify-toolkit) ![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

**Permify Toolkit** is a comprehensive set of tools designed to streamline authorization management with [Permify](https://github.com/Permify/permify). Manage your authorization logic in one place with ease and flexibility.

## Features

This monorepo contains a suite of packages to enhance your Permify experience:

- **@permify-toolkit/core**: The core logic and helpers for building schemas and managing authorization.
- **@permify-toolkit/cli**: Command-line interface for common Permify tasks and code generation.
- **@permify-toolkit/nestjs**: Seamless integration for NestJS applications.

## Installation

This project is managed using [pnpm](https://pnpm.io/).

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install
```

## Usage

This is a monorepo containing multiple packages. Please refer to the specific package directories in `packages/` for detailed usage instructions.

### Basic Workflow

1.  **Build all packages**:

    ```bash
    pnpm build
    ```

2.  **Run tests**:
    ```bash
    pnpm test
    ```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started, our code of conduct, and development workflows.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
