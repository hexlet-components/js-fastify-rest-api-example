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

const ComponentsSchemasUser = T.Object({
  id: T.Number(),
  fullName: T.String(),
  phone: T.String()
})
const ComponentsSchemasUnprocessableEntityError = T.Object({
  code: T.Literal('UNPROCESSABLE_ENTITY'),
  message: T.String()
})
const ComponentsSchemasNotFoundError = T.Object({
  code: T.Literal('NOT_FOUND'),
  message: T.String()
})
const ComponentsSchemasUserUpdate = T.Object({
  id: T.Optional(T.Number()),
  fullName: T.Optional(T.String()),
  phone: T.Optional(T.String())
})

const schema = {
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
        body: CloneType(ComponentsSchemasUser, {
          'x-content-type': 'application/json'
        })
      }),
      data: T.Any({ 'x-status-code': '201' }),
      error: T.Union([
        CloneType(ComponentsSchemasUnprocessableEntityError, {
          'x-status-code': '422',
          'x-content-type': 'application/json'
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
          'x-content-type': 'application/json'
        })
      ])
    },
    PATCH: {
      args: T.Object({
        params: T.Object({
          id: T.Number({ 'x-in': 'path' })
        }),
        body: CloneType(ComponentsSchemasUserUpdate, {
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
          'x-content-type': 'application/json'
        }),
        CloneType(ComponentsSchemasUnprocessableEntityError, {
          'x-status-code': '422',
          'x-content-type': 'application/json'
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
          'x-content-type': 'application/json'
        })
      ])
    }
  }
}

const _components = {
  schemas: {
    NotFoundError: CloneType(ComponentsSchemasNotFoundError),
    UnprocessableEntityError: CloneType(
      ComponentsSchemasUnprocessableEntityError
    ),
    User: CloneType(ComponentsSchemasUser),
    UserUpdate: CloneType(ComponentsSchemasUserUpdate)
  }
}

export { schema, _components as components }
