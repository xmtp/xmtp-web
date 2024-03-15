declare namespace NodeJS {
  export interface ProcessEnv {
    PROJECT_ID: string;
    [key: string]: string | undefined;
  }
}
