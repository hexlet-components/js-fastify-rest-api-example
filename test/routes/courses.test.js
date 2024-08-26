import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import { buildCourse } from '../../lib/data.js'

test('get courses', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/courses',
  })
  assert.equal(res.statusCode, 200)
})

test('get courses/:id', async (t) => {
  const app = await build(t)

  const course = await app.db.query.courses.findFirst()
  assert.ok(course)

  const res = await app.inject({
    url: `/courses/${course.id}`,
  })
  assert.equal(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), { id: course.id })
})

test('post courses', async (t) => {
  const app = await build(t)
  const body = buildCourse()

  const res = await app.inject({
    method: 'post',
    url: `/courses`,
    body: body,
  })
  assert.equal(res.statusCode, 201, res.body)
})

test('patch courses/:id', async (t) => {
  const app = await build(t)

  const course = await app.db.query.courses.findFirst()
  assert.ok(course)

  const res = await app.inject({
    method: 'patch',
    url: `/courses/${course.id}`,
    body: buildCourse(),
  })
  assert.equal(res.statusCode, 200)
})

test('delete courses/:id', async (t) => {
  const app = await build(t)

  const course = await app.db.query.courses.findFirst()
  assert.ok(course)

  const res = await app.inject({
    method: 'delete',
    url: `/courses/${course.id}`,
  })

  assert.equal(res.statusCode, 204)
})
