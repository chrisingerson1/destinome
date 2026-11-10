import { defineConfig } from "@neon/config/v1";

// Every Neon branch includes Postgres. Leave other services and branch settings
// undeclared so this app's configuration only manages its database connection.
export default defineConfig({});
