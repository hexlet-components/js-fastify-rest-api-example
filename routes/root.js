export default async function (fastify) {
  fastify.get('/', async function () {
    return { root: true }
  })
  fastify.get('/about', async function () {
    return 'Hexlet project'
  })
}
