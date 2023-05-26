export type OnError = {
  /**
   * Callback function to execute when an error occurs
   */
  onError?: (error: unknown | Error) => void;
};

export type CanMessageReturns<T> = T extends string
  ? boolean
  : T extends string[]
  ? boolean[]
  : never;
