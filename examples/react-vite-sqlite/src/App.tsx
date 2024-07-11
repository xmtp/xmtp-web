import { useCallback, useEffect, useRef } from "react";

const onMessage = (event: MessageEvent) => {
  // eslint-disable-next-line no-console
  console.log("Message from worker", event.data);
};

export const App: React.FC = () => {
  const workerRef = useRef<Worker | null>(null);

  const onClick = useCallback(() => {
    workerRef.current?.postMessage(
      "CREATE TABLE IF NOT EXISTS t(x PRIMARY KEY);INSERT OR REPLACE INTO t VALUES ('foo'), ('bar');SELECT * FROM t;",
    );
  }, []);

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    worker.addEventListener("message", onMessage);
    workerRef.current = worker;
    return () => {
      worker.removeEventListener("message", onMessage);
      worker.terminate();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>SQLite Test App</h1>
      </header>
      <main>
        <p>Test SQLite database with React and Vite</p>
        <button type="button" onClick={onClick}>
          Do the thing
        </button>
      </main>
    </div>
  );
};
