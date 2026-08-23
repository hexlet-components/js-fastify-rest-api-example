import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// scrypt из node:crypto, без внешних зависимостей.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options: { cost: number; maxmem: number },
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

// Цена подбора. Дефолт node — 16384, это ~230 мс на хеш; в тестах, где сиды
// заводят пользователей на каждый build(), столько платить незачем, поэтому
// стоимость выносится в окружение.
const DEFAULT_COST = 16384;

function currentCost() {
  const configured = Number(process.env.SCRYPT_COST);
  return Number.isSafeInteger(configured) && configured > 1 ? configured : DEFAULT_COST;
}

// scrypt требует памяти порядка 128 * N * r; дефолтного maxmem хватает только
// до N = 16384, поэтому лимит считается от стоимости.
function memoryFor(cost: number) {
  return 128 * cost * 8 * 2;
}

// Стоимость хранится внутри дайджеста, а не берётся из окружения при проверке:
// иначе смена SCRYPT_COST разом обесценивает все выданные хеши.
export async function hashPassword(password: string) {
  const cost = currentCost();
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH, {
    cost,
    maxmem: memoryFor(cost),
  });
  return `scrypt$${cost}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, digest: string) {
  const [scheme, rawCost, salt, key] = digest.split("$");
  if (scheme !== "scrypt" || !rawCost || !salt || !key) return false;

  const cost = Number(rawCost);
  if (!Number.isSafeInteger(cost) || cost < 2) return false;

  const expected = Buffer.from(key, "hex");
  const derived = await scryptAsync(password, salt, expected.length, {
    cost,
    maxmem: memoryFor(cost),
  });
  // Сравнение за постоянное время: обычное === утекает длину общего префикса.
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
