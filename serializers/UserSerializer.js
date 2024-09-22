export default class UserSerializer {
  index(users) {
    return { data: users, meta: {} }
  }
}
