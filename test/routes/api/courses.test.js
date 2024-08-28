import { test } from 'node:test'
import * as assert from 'node:assert'
import { getAuthHeader, build } from '../../helper.js'
import { buildCourse } from '../../../lib/data.js'

test('get courses', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/api/courses',
  })
  assert.equal(res.statusCode, 200)
})

test('get courses/:id', async (t) => {
  const app = await build(t)

  const course = await app.db.query.courses.findFirst()
  assert.ok(course)

  const res = await app.inject({
    url: `/api/courses/${course.id}`,
  })
  assert.equal(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.payload), { id: course.id })
})

test('post courses', async (t) => {
  const app = await build(t)
  const body = buildCourse()

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    method: 'post',
    url: `/api/courses`,
    headers: {
      ...authHeader,
    },
    body: body,
  })
  assert.equal(res.statusCode, 201, res.body)
})

test('patch courses/:id', async (t) => {
  const app = await build(t)

  const course = await app.db.query.courses.findFirst()
  assert.ok(course)

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    method: 'patch',
    url: `/api/courses/${course.id}`,
    headers: {
      ...authHeader,
    },
    body: buildCourse(),
  })
  assert.equal(res.statusCode, 200)
})

test('delete courses/:id', async (t) => {
  const app = await build(t)

  const course = await app.db.query.courses.findFirst()
  assert.ok(course)

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    method: 'delete',
    headers: {
      ...authHeader,
    },
    url: `/api/courses/${course.id}`,
  })

  assert.equal(res.statusCode, 204)
})
