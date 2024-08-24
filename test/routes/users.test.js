import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import { buildUser } from '../data.js'

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

  const res = await app.inject({
    method: 'post',
    url: `/users`,
    body: buildUser(),
  })
  assert.equal(res.statusCode, 201)
  // assert.deepStrictEqual(JSON.parse(res.payload), { id: user.id })
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
  // assert.deepStrictEqual(JSON.parse(res.payload), { id: user.id })
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
  // assert.deepStrictEqual(JSON.parse(res.payload), { id: user.id })
})
