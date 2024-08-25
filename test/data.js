import { faker } from '@faker-js/faker'
import { components } from '../schema.js'

/**
 * @typedef {typeof components.schemas.User} UserSchema
 * @typedef {import('@fastify/type-provider-typebox').Static<UserSchema>} User
 * @param {Partial<User>} params
 * @return {Partial<User>}
 */
export function buildUser(params = {}) {
  const user = {
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
  }

  return Object.assign({}, user, params)
}
