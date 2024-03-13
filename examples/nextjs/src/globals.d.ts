declare namespace NodeJS {
  export interface ProcessEnv {
    NEXT_PUBLIC_PROJECT_ID: string;
    NEXT_PUBLIC_INFURA_ID: string;
    [key: string]: string | undefined;
  }
}
