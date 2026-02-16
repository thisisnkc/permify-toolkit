# Permify Toolkit Simulator

This is a sample NestJS application used to demonstrate and test the integration of the Permify Toolkit.

## Features

- Integrates `@permify-toolkit/nestjs` for authorization.
- Uses `@permify-toolkit/cli` for schema management.
- Local development setup for Permify.

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Permify

The simulator uses `permify.config.ts` for configuration. Ensure your Permify server is running at `localhost:3478`.

### 3. Push Schema

Use the toolkit CLI to push the sample schema. You must provide a tenant ID (use `-c` to create it if it doesn't exist):

```bash
pnpm schema:push -- --tenant my-tenant -c
```

### 4. Run the Application

```bash
pnpm start:dev
```

The server will start at `http://localhost:3000`.
