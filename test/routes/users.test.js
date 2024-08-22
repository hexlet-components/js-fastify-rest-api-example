import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

test('users', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/users',
  })

  const result = [
    {
      fullName: 'Andrew',
      id: 1,
    },
  ]
  assert.deepStrictEqual(JSON.parse(res.payload), result)
})

test('users/:id', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    url: `/users/${user.id}`,
  })
  assert.deepStrictEqual(JSON.parse(res.payload), { id: user.id })
})
