import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../../helper.js'

test('post tokens', async (t) => {
  const app = await build(t)

  const user = await app.db.query.users.findFirst()
  assert.ok(user)

  const res = await app.inject({
    method: 'post',
    url: `/api/tokens`,
    body: {
      email: user.email,
      password: '',
    },
  })
  assert.equal(res.statusCode, 201, res.body)
})
