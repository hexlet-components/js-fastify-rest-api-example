import { test } from 'node:test'
import * as assert from 'node:assert'
import { getAuthHeader, build } from '../../../helper.js'
import { buildCourseLesson } from '../../../../lib/data.js'

test('get lessons', async (t) => {
  const app = await build(t)

  const lesson = await app.db.query.courseLessons.findFirst()
  assert.ok(lesson)

  const res = await app.inject({
    url: `/api/courses/${lesson.courseId}/lessons`,
  })
  assert.equal(res.statusCode, 200, res.body)
})

test('get lessons/:id', async (t) => {
  const app = await build(t)

  const lesson = await app.db.query.courseLessons.findFirst()
  assert.ok(lesson)

  const res = await app.inject({
    url: `/api/courses/${lesson.courseId}/lessons/${lesson.id}`,
  })
  assert.equal(res.statusCode, 200, res.body)
  // assert.deepStrictEqual(JSON.parse(res.payload), { id: course.id })
})

test('post lessons', async (t) => {
  const app = await build(t)
  const course = await app.db.query.courses.findFirst()
  assert.ok(course)

  const body = buildCourseLesson()

  const authHeader = await getAuthHeader(app)
  const res = await app.inject({
    method: 'post',
    url: `/api/courses/${course.id}/lessons`,
    headers: {
      ...authHeader,
    },
    body: body,
  })
  assert.equal(res.statusCode, 201, res.body)
})
