import { v4 } from "uuid";
import type {
  UtilsEventsData,
  UtilsEventsErrorData,
  UtilsEventsResult,
  UtilsWorkerEvents,
  UtilsWorkerEventsData,
} from "@/types";

const handleError = (event: ErrorEvent) => {
  console.error(`Worker error on line ${event.lineno} in "${event.filename}"`);
  console.error(event.message);
};

export class UtilsWorkerClass {
  #worker: Worker;

  #promises = new Map<
    string,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  >();

  constructor(worker: Worker) {
    this.#worker = worker;
    this.#worker.addEventListener("message", this.handleMessage);
    this.#worker.addEventListener("error", handleError);
  }

  sendMessage<A extends UtilsWorkerEvents>(
    action: A,
    data: Extract<UtilsWorkerEventsData, { action: A }>["data"],
  ) {
    const promiseId = v4();
    this.#worker.postMessage({
      action,
      id: promiseId,
      data,
    });
    const promise = new Promise<UtilsEventsResult<A>>((resolve, reject) => {
      this.#promises.set(promiseId, { resolve, reject });
    });
    return promise;
  }

  handleMessage = (
    event: MessageEvent<UtilsEventsData | UtilsEventsErrorData>,
  ) => {
    const eventData = event.data;
    // eslint-disable-next-line no-console
    console.log("utils received event data", eventData);
    const promise = this.#promises.get(eventData.id);
    if (promise) {
      this.#promises.delete(eventData.id);
      if ("error" in eventData) {
        promise.reject(new Error(eventData.error));
      } else {
        promise.resolve(eventData.result);
      }
    }
  };

  close() {
    this.#worker.removeEventListener("message", this.handleMessage);
    this.#worker.removeEventListener("error", handleError);
    this.#worker.terminate();
  }
}