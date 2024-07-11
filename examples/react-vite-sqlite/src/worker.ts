/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-restricted-globals */
import * as SQLite from "@xmtp/wa-sqlite";
import initModule from "@xmtp/wa-sqlite/build";
import { OPFSCoopSyncVFS } from "@xmtp/wa-sqlite/vfs/OPFSCoopSync";

const module = await initModule();
const sqlite3 = SQLite.Factory(module);
const vfs = await OPFSCoopSyncVFS.create("test", module);
sqlite3.vfs_register(vfs, true);

// Open the database.
const db = await sqlite3.open_v2("test");

// eslint-disable-next-line @typescript-eslint/no-misused-promises
self.addEventListener("message", async (event) => {
  // eslint-disable-next-line no-console
  console.log("message from main received in worker:", event.data);

  const sql = event.data as string;
  try {
    const results: {
      rows: SQLiteCompatibleType[][];
      columns: string[];
    }[] = [];
    await sqlite3.exec(db, sql, (row, columns) => {
      if (columns !== results.at(-1)?.columns) {
        results.push({ columns, rows: [] });
      }
      results.at(-1)?.rows.push(row);
    });

    self.postMessage(results);
  } catch (error) {
    self.postMessage({ error: (error as Error).message });
  }
});
