import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// scrypt из node:crypto, без внешних зависимостей: параметры по умолчанию у
// него уже подобраны под пароли. Соль хранится рядом с хешем в одной строке —
// отдельная колонка ничего не даёт, соль не секрет.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, digest: string) {
  const [salt, key] = digest.split(":");
  if (!salt || !key) return false;

  const expected = Buffer.from(key, "hex");
  const derived = await scryptAsync(password, salt, expected.length);
  // Сравнение за постоянное время: обычное === утекает длину общего префикса.
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
