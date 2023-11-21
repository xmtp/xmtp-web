export type OnError = {
  /**
   * Callback function to execute when an error occurs
   */
  onError?: (error: Error) => void;
};

export type CanMessageReturns<T> = T extends string
  ? boolean
  : T extends string[]
    ? boolean[]
    : never;

export type RemoveLastParameter<F> = F extends (...args: infer A) => infer R
  ? (...args: A extends [...infer U, any] ? U : never) => R
  : never;
