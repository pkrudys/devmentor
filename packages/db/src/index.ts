import { MikroORM } from "@mikro-orm/postgresql";
import config from "./mikro-orm.config";

export function initOrm() {
  return MikroORM.init(config);
}

export { User } from "./entities/User";
export { default as mikroOrmConfig } from "./mikro-orm.config";
