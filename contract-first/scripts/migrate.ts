import { createStore } from "../src/db.ts";
const store = await createStore();
await store.close();
console.log("Migration applied");
