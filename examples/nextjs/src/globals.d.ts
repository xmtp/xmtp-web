declare namespace NodeJS {
  export interface ProcessEnv {
    NEXT_PUBLIC_PROJECT_ID: string;
    [key: string]: string | undefined;
  }
}
