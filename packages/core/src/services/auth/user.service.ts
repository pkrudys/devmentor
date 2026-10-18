import { User } from "@devmentor/db";
import type { Cradle } from "../../container/cradle";
import { NotFoundError } from "../../http/errors";

export interface CreateUserInput {
  email: string;
  name: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
}

/** First concept service — the reference example for the `<concept>/<name>.service.ts` convention. */
export class UserService {
  private readonly em: Cradle["em"];

  // Awilix's default PROXY injection mode passes the whole cradle as the
  // single constructor argument — it does not resolve by parameter name.
  // Destructure what you need, don't treat the argument itself as `em`.
  constructor({ em }: Pick<Cradle, "em">) {
    this.em = em;
  }

  list() {
    return this.em.find(User, {});
  }

  async create(input: CreateUserInput) {
    const user = this.em.create(User, input);
    // persistAndFlush was removed in MikroORM 7 — persist()/remove() stage, flush() commits.
    await this.em.persist(user).flush();
    return user;
  }

  async update(id: string, input: UpdateUserInput) {
    const user = await this.em.findOne(User, { id });
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }
    this.em.assign(user, input);
    await this.em.flush();
    return user;
  }

  async remove(id: string) {
    const user = await this.em.findOne(User, { id });
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }
    await this.em.remove(user).flush();
  }
}
