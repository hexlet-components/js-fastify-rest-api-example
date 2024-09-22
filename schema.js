/* eslint eslint-comments/no-unlimited-disable: off */
/* eslint-disable */
// This document was generated automatically by openapi-box

/**
 * @typedef {import('@sinclair/typebox').TSchema} TSchema
 */

/**
 * @template {TSchema} T
 * @typedef {import('@sinclair/typebox').Static<T>} Static
 */

/**
 * @typedef {import('@sinclair/typebox').SchemaOptions} SchemaOptions
 */

/**
 * @typedef {{
 *  [Path in keyof typeof schema]: {
 *    [Method in keyof typeof schema[Path]]: {
 *      [Prop in keyof typeof schema[Path][Method]]: typeof schema[Path][Method][Prop] extends TSchema ?
 *        Static<typeof schema[Path][Method][Prop]> :
 *        undefined
 *    }
 *  }
 * }} SchemaType
 */

/**
 * @typedef {{
 *  [ComponentType in keyof typeof _components]: {
 *    [ComponentName in keyof typeof _components[ComponentType]]: typeof _components[ComponentType][ComponentName] extends TSchema ?
 *      Static<typeof _components[ComponentType][ComponentName]> :
 *      undefined
 *  }
 * }} ComponentType
 */

import { Type as T, TypeRegistry, Kind, CloneType } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

/**
 * @typedef {{
 *  [Kind]: 'Binary'
 *  static: string | File | Blob | Uint8Array
 *  anyOf: [{
 *    type: 'object',
 *    additionalProperties: true
 *  }, {
 *    type: 'string',
 *    format: 'binary'
 *  }]
 * } & TSchema} TBinary
 */

/**
 * @returns {TBinary}
 */
const Binary = () => {
  /**
   * @param {TBinary} schema
   * @param {unknown} value
   * @returns {boolean}
   */
  function BinaryCheck(schema, value) {
    const type = Object.prototype.toString.call(value)
    return (
      type === '[object Blob]' ||
      type === '[object File]' ||
      type === '[object String]' ||
      type === '[object Uint8Array]'
    )
  }

  if (!TypeRegistry.Has('Binary')) TypeRegistry.Set('Binary', BinaryCheck)

  return /** @type {TBinary} */ ({
    anyOf: [
      {
        type: 'object',
        additionalProperties: true
      },
      {
        type: 'string',
        format: 'binary'
      }
    ],
    [Kind]: 'Binary'
  })
}

const ComponentsSchemasCourse = T.Object({
  id: T.Number(),
  name: T.String(),
  description: T.String(),
  createdAt: T.String({ format: 'date-time' })
})
const ComponentsSchemasUnprocessableEntityError = T.Object({
  type: T.Optional(T.String()),
  title: T.Optional(T.String()),
  status: T.Optional(T.Integer()),
  detail: T.Optional(T.String()),
  instance: T.Optional(T.String()),
  errors: T.Array(
    T.Object({
      message: T.String(),
      rule: T.String(),
      field: T.String()
    })
  )
})
const ComponentsSchemasCourseCreateDto = T.Object({
  name: T.String(),
  description: T.String()
})
const ComponentsSchemasCourseLesson = T.Object({
  id: T.Number(),
  courseId: T.Number(),
  name: T.String(),
  body: T.String(),
  createdAt: T.String({ format: 'date-time' })
})
const ComponentsSchemasUnauthorizedError = T.Object({
  type: T.Optional(T.String()),
  title: T.Optional(T.String()),
  status: T.Optional(T.Integer()),
  detail: T.Optional(T.String()),
  instance: T.Optional(T.String())
})
const ComponentsSchemasCourseLessonCreateDto = T.Object({
  name: T.String(),
  body: T.String()
})
const ComponentsSchemasNotFoundError = T.Object({
  type: T.Optional(T.String()),
  title: T.Optional(T.String()),
  status: T.Optional(T.Integer()),
  detail: T.Optional(T.String()),
  instance: T.Optional(T.String())
})
const ComponentsSchemasCourseEditDto = T.Object({
  name: T.Optional(T.String()),
  description: T.Optional(T.String())
})
const ComponentsSchemasTokenInfo = T.Object({
  token: T.String()
})
const ComponentsSchemasAuthInfo = T.Object({
  email: T.String(),
  password: T.String()
})
const ComponentsSchemasUser = T.Object({
  id: T.Number(),
  fullName: T.Union([T.Null(), T.String({ minLength: 2, maxLength: 100 })]),
  email: T.String({ format: 'email' }),
  createdAt: T.String({ format: 'date-time' })
})
const ComponentsSchemasUserCreateDto = T.Object({
  fullName: T.Optional(T.String()),
  email: T.String()
})
const ComponentsSchemasUserEditDto = T.Object({
  fullName: T.Optional(T.String())
})

const schema = {
  '/courses': {
    GET: {
      args: T.Optional(
        T.Object({
          query: T.Optional(
            T.Object({
              page: T.Optional(T.Number({ default: 1, 'x-in': 'query' }))
            })
          )
        })
      ),
      data: T.Object(
        {
          data: T.Array(CloneType(ComponentsSchemasCourse))
        },
        {
          'x-status-code': '200',
          'x-content-type': 'application/json'
        }
      ),
      error: T.Union([T.Any({ 'x-status-code': 'default' })])
    },
    POST: {
      args: T.Object({
        body: CloneType(ComponentsSchemasCourseCreateDto, {
          'x-content-type': 'application/json'
        })
      }),
      data: CloneType(ComponentsSchemasCourse, {
        'x-status-code': '201',
        'x-content-type': 'application/json'
      }),
      error: T.Union([
        CloneType(ComponentsSchemasUnprocessableEntityError, {
          'x-status-code': '422',
          'x-content-type': 'application/problem+json'
        })
      ])
    }
  },
  '/courses/{courseId}/lessons': {
    GET: {
      args: T.Object({
        params: T.Object({
          courseId: T.Number({ 'x-in': 'path' })
        }),
        query: T.Optional(
          T.Object({
            page: T.Optional(T.Number({ default: 1, 'x-in': 'query' }))
          })
        )
      }),
      data: T.Object(
        {
          data: T.Array(CloneType(ComponentsSchemasCourseLesson))
        },
        {
          'x-status-code': '200',
          'x-content-type': 'application/json'
        }
      ),
      error: T.Union([T.Any({ 'x-status-code': 'default' })])
    },
    POST: {
      args: T.Object({
        params: T.Object({
          courseId: T.Number({ 'x-in': 'path' })
        }),
        body: CloneType(ComponentsSchemasCourseLessonCreateDto, {
          'x-content-type': 'application/json'
        })
      }),
      data: CloneType(ComponentsSchemasCourseLesson, {
        'x-status-code': '201',
        'x-content-type': 'application/json'
      }),
      error: T.Union([
        CloneType(ComponentsSchemasUnauthorizedError, {
          'x-status-code': '401',
          'x-content-type': 'application/problem+json'
        }),
        CloneType(ComponentsSchemasUnprocessableEntityError, {
          'x-status-code': '422',
          'x-content-type': 'application/problem+json'
        })
      ])
    }
  },
  '/courses/{courseId}/lessons/{id}': {
    GET: {
      args: T.Object({
        params: T.Object({
          courseId: T.Number({ 'x-in': 'path' }),
          id: T.Number({ 'x-in': 'path' })
        })
      }),
      data: CloneType(ComponentsSchemasCourseLesson, {
        'x-status-code': '200',
        'x-content-type': 'application/json'
      }),
      error: T.Union([
        CloneType(ComponentsSchemasNotFoundError, {
          'x-status-code': '404',
          'x-content-type': 'application/problem+json'
        })
      ])
    }
  },
  '/courses/{id}': {
    GET: {
      args: T.Object({
        params: T.Object({
          id: T.Number({ 'x-in': 'path' })
        })
      }),
      data: CloneType(ComponentsSchemasCourse, {
        'x-status-code': '200',
        'x-content-type': 'application/json'
      }),
      error: T.Union([
        CloneType(ComponentsSchemasNotFoundError, {
          'x-status-code': '404',
          'x-content-type': 'application/problem+json'
        })
      ])
    },
    PATCH: {
      args: T.Object({
        params: T.Object({
          id: T.Number({ 'x-in': 'path' })
        }),
        body: CloneType(ComponentsSchemasCourseEditDto, {
          'x-content-type': 'application/json'
        })
      }),
      data: CloneType(ComponentsSchemasCourse, {
        'x-status-code': '200',
        'x-content-type': 'application/json'
      }),
      error: T.Union([
        CloneType(ComponentsSchemasUnauthorizedError, {
          'x-status-code': '401',
          'x-content-type': 'application/problem+json'
        }),
        CloneType(ComponentsSchemasNotFoundError, {
          'x-status-code': '404',
          'x-content-type': 'application/problem+json'
        }),
        CloneType(ComponentsSchemasUnprocessableEntityError, {
          'x-status-code': '422',
          'x-content-type': 'application/problem+json'
        })
      ])
    },
    DELETE: {
      args: T.Object({
        params: T.Object({
          id: T.Number({ 'x-in': 'path' })
        })
      }),
      data: T.Any({ 'x-status-code': '204' }),
      error: T.Union([
        CloneType(ComponentsSchemasUnauthorizedError, {
          'x-status-code': '401',
          'x-content-type': 'application/problem+json'
        }),
        CloneType(ComponentsSchemasNotFoundError, {
          'x-status-code': '404',
          'x-content-type': 'application/problem+json'
        })
      ])
    }
  },
  '/tokens': {
    POST: {
      args: T.Object({
        body: CloneType(ComponentsSchemasAuthInfo, {
          'x-content-type': 'application/json'
        })
      }),
      data: CloneType(ComponentsSchemasTokenInfo, {
        'x-status-code': '201',
        'x-content-type': 'application/json'
      }),
      error: T.Union([
        CloneType(ComponentsSchemasUnprocessableEntityError, {
          'x-status-code': '422',
          'x-content-type': 'application/problem+json'
        })
      ])
    }
  },
  '/users': {
    GET: {
      args: T.Optional(
        T.Object({
          query: T.Optional(
            T.Object({
              page: T.Optional(T.Number({ default: 1, 'x-in': 'query' }))
            })
          )
        })
      ),
      data: T.Object(
        {
          data: T.Array(CloneType(ComponentsSchemasUser))
        },
        {
          'x-status-code': '200',
          'x-content-type': 'application/json'
        }
      ),
      error: T.Union([T.Any({ 'x-status-code': 'default' })])
    },
    POST: {
      args: T.Object({
        body: CloneType(ComponentsSchemasUserCreateDto, {
          'x-content-type': 'application/json'
        })
      }),
      data: CloneType(ComponentsSchemasUser, {
        'x-status-code': '201',
        'x-content-type': 'application/json'
      }),
      error: T.Union([
        CloneType(ComponentsSchemasUnprocessableEntityError, {
          'x-status-code': '422',
          'x-content-type': 'application/problem+json'
        })
      ])
    }
  },
  '/users/{id}': {
    GET: {
      args: T.Object({
        params: T.Object({
          id: T.Number({ 'x-in': 'path' })
        })
      }),
      data: CloneType(ComponentsSchemasUser, {
        'x-status-code': '200',
        'x-content-type': 'application/json'
      }),
      error: T.Union([
        CloneType(ComponentsSchemasNotFoundError, {
          'x-status-code': '404',
          'x-content-type': 'application/problem+json'
        })
      ])
    },
    PATCH: {
      args: T.Object({
        params: T.Object({
          id: T.Number({ 'x-in': 'path' })
        }),
        body: CloneType(ComponentsSchemasUserEditDto, {
          'x-content-type': 'application/json'
        })
      }),
      data: CloneType(ComponentsSchemasUser, {
        'x-status-code': '200',
        'x-content-type': 'application/json'
      }),
      error: T.Union([
        CloneType(ComponentsSchemasNotFoundError, {
          'x-status-code': '404',
          'x-content-type': 'application/problem+json'
        }),
        CloneType(ComponentsSchemasUnprocessableEntityError, {
          'x-status-code': '422',
          'x-content-type': 'application/problem+json'
        })
      ])
    },
    DELETE: {
      args: T.Object({
        params: T.Object({
          id: T.Number({ 'x-in': 'path' })
        })
      }),
      data: T.Any({ 'x-status-code': '204' }),
      error: T.Union([
        CloneType(ComponentsSchemasNotFoundError, {
          'x-status-code': '404',
          'x-content-type': 'application/problem+json'
        })
      ])
    }
  }
}

const _components = {
  schemas: {
    AuthInfo: CloneType(ComponentsSchemasAuthInfo),
    Course: CloneType(ComponentsSchemasCourse),
    CourseCreateDTO: CloneType(ComponentsSchemasCourseCreateDto),
    CourseEditDTO: CloneType(ComponentsSchemasCourseEditDto),
    CourseLesson: CloneType(ComponentsSchemasCourseLesson),
    CourseLessonCreateDTO: CloneType(ComponentsSchemasCourseLessonCreateDto),
    ForbiddenError: T.Object({
      type: T.Optional(T.String()),
      title: T.Optional(T.String()),
      status: T.Optional(T.Integer()),
      detail: T.Optional(T.String()),
      instance: T.Optional(T.String())
    }),
    NotFoundError: CloneType(ComponentsSchemasNotFoundError),
    ProblemDetails: T.Object({
      type: T.Optional(T.String()),
      title: T.Optional(T.String()),
      status: T.Optional(T.Integer()),
      detail: T.Optional(T.String()),
      instance: T.Optional(T.String())
    }),
    Timestamps: T.Object({
      createdAt: T.String({ format: 'date-time' })
    }),
    TokenInfo: CloneType(ComponentsSchemasTokenInfo),
    UnauthorizedError: CloneType(ComponentsSchemasUnauthorizedError),
    UnprocessableEntityError: CloneType(
      ComponentsSchemasUnprocessableEntityError
    ),
    User: CloneType(ComponentsSchemasUser),
    UserCreateDTO: CloneType(ComponentsSchemasUserCreateDto),
    UserEditDTO: CloneType(ComponentsSchemasUserEditDto),
    Versions: T.Union([T.Literal('v1'), T.Literal('v2')])
  }
}

export { schema, _components as components }
