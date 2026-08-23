import { users } from "./schema.ts";

// Хеш пароля не должен покидать базу, а обработчики отдают строку целиком и
// схема ответа лишнее не отсечёт: у User в контракте нет
// additionalProperties: false. Поэтому публичная проекция описана здесь один
// раз — columns для relational query API, fields для .returning() у
// insert/update. Набор полей повторяет модель User из main.tsp.
//
// Лежит отдельно от schema.ts намеренно: в объект, который уходит в
// drizzle({ schema }), должны попадать только таблицы.
export const publicUserColumns = {
  id: true,
  fullName: true,
  email: true,
} as const;

export const publicUserFields = {
  id: users.id,
  fullName: users.fullName,
  email: users.email,
};
