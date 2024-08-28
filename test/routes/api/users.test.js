import { test } from 'node:test'
import * as assert from 'node:assert'
import { build, authHeaders } from '../../helper.js'
import { buildUser } from '../../../lib/data.js'

test('get users', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/api/users',
    headers: {
      ...authHeaders(),
    },
  })
  assert.equal(res.statusCode, 200)
})

test('get users/:id', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    url: `/api/users/${user.id}`,
    headers: {
      ...authHeaders(),
    },
  })
  assert.equal(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), { id: user.id })
})

test('post users', async (t) => {
  const app = await build(t)
  const body = buildUser()

  const res = await app.inject({
    method: 'post',
    url: `/api/users`,
    body: body,
    headers: {
      ...authHeaders(),
    },
  })
  assert.equal(res.statusCode, 201, res.body)
})

test('post users (unique email)', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    method: 'post',
    url: `/api/users`,
    body: buildUser({ email: user.email }),
    headers: {
      ...authHeaders(),
    },
  })
  assert.equal(res.statusCode, 422)
})

test('patch users/:id', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    method: 'patch',
    url: `/api/users/${user.id}`,
    body: buildUser(),
    headers: {
      ...authHeaders(),
    },
  })
  assert.equal(res.statusCode, 200)
})

test('delete users/:id', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    method: 'delete',
    url: `/api/users/${user.id}`,
    headers: {
      ...authHeaders(),
    },
  })

  assert.equal(res.statusCode, 204)
})
