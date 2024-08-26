import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../../helper.js'
import { buildCourseLesson } from '../../../lib/data.js'

test('get lessons', async (t) => {
  const app = await build(t)

  const lesson = await app.db.query.courseLessons.findFirst()
  assert.ok(lesson)

  const res = await app.inject({
    url: `/courses/${lesson.courseId}/lessons`,
  })
  assert.equal(res.statusCode, 200)
})

test('get lessons/:id', async (t) => {
  const app = await build(t)

  const lesson = await app.db.query.courseLessons.findFirst()
  assert.ok(lesson)

  const res = await app.inject({
    url: `/courses/${lesson.courseId}/lessons/${lesson.id}`,
  })
  assert.equal(res.statusCode, 200)
  // assert.deepStrictEqual(JSON.parse(res.payload), { id: course.id })
})

test('post courses', async (t) => {
  const app = await build(t)
  const course = await app.db.query.courses.findFirst()
  assert.ok(course)

  const body = buildCourseLesson()

  const res = await app.inject({
    method: 'post',
    url: `/courses/${course.id}/lessons`,
    body: body,
  })
  assert.equal(res.statusCode, 201, res.body)
})
