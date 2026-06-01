import { test } from 'vitest'
import * as assert from 'node:assert'
import { build, getAuthHeader } from '../../helper.ts'
import { buildUser } from '../../../lib/data.ts'

test('get users', async () => {
  const app = await build()

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    url: '/users',
    headers: {
      ...authHeader,
    },
  })
  assert.equal(res.statusCode, 200, res.body)
})

test('get users/:id', async () => {
  const app = await build()

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    url: `/users/${user.id}`,
    headers: {
      ...authHeader,
    },
  })
  assert.equal(res.statusCode, 200, res.body)
  // assert.deepStrictEqual(JSON.parse(res.payload), { id: user.id })
})

test('post users', async () => {
  const app = await build()
  const body = buildUser()

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    method: 'post',
    url: `/users`,
    body: body,
    headers: {
      ...authHeader,
    },
  })
  assert.equal(res.statusCode, 201, res.body)
})

test('post users (unique email)', async () => {
  const app = await build()

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    method: 'post',
    url: `/users`,
    body: buildUser({ email: user.email.toUpperCase() }),
    headers: {
      ...authHeader,
    },
  })
  assert.equal(res.statusCode, 422, res.body)
})

test('patch users/:id', async () => {
  const app = await build()

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    method: 'put',
    url: `/users/${user.id}`,
    body: buildUser(),
    headers: {
      ...authHeader,
    },
  })
  assert.equal(res.statusCode, 200, res.body)
})

test('delete users/:id', async () => {
  const app = await build()

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    method: 'delete',
    url: `/users/${user.id}`,
    headers: {
      ...authHeader,
    },
  })

  assert.equal(res.statusCode, 204, res.body)
})
