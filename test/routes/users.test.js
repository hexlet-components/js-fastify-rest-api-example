import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import { buildUser } from '../../lib/data.js'

test('get users', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/users',
  })
  assert.equal(res.statusCode, 200)
})

test('get users/:id', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    url: `/users/${user.id}`,
  })
  assert.equal(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), { id: user.id })
})

test('post users', async (t) => {
  const app = await build(t)
  const body = buildUser()

  const res = await app.inject({
    method: 'post',
    url: `/users`,
    body: body,
  })
  assert.equal(res.statusCode, 201, res.body)
})

test('post users (unique email)', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    method: 'post',
    url: `/users`,
    body: buildUser({ email: user.email }),
  })
  assert.equal(res.statusCode, 422)
})

test('patch users/:id', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    method: 'patch',
    url: `/users/${user.id}`,
    body: buildUser(),
  })
  assert.equal(res.statusCode, 200)
})

test('delete users/:id', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    method: 'delete',
    url: `/users/${user.id}`,
  })

  assert.equal(res.statusCode, 204)
})
