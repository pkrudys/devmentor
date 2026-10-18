import { defineConfig } from "@mikro-orm/postgresql";
import { User } from "./entities";

// DEVMENTOR_DATABASE_URL takes priority: sandboxes/platforms that already
// export a generic DATABASE_URL for their own default database (e.g. this
// one's "open-mercato") pass it through to every child process, which Next's
// .env.local loading can't override (it never replaces an already-set
// process.env var). A project-specific name sidesteps that collision.
const clientUrl = process.env.DEVMENTOR_DATABASE_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  entities: [User],
  ...(clientUrl
    ? { clientUrl }
    : {
        dbName: process.env.DB_NAME ?? "devmentor",
        host: process.env.DB_HOST ?? "localhost",
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        user: process.env.DB_USER ?? "postgres",
        password: process.env.DB_PASSWORD ?? "postgres",
      }),
  pool: {
    min: 2,
    max: 10,
  },
});
