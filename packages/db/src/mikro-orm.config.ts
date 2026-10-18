import { defineConfig } from "@mikro-orm/postgresql";
import { User } from "./entities/User";

export default defineConfig({
  entities: [User],
  dbName: process.env.DB_NAME ?? "devmentor",
  host: process.env.DB_HOST ?? "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  pool: {
    min: 2,
    max: 10,
  },
});
