/// <reference types="vite/client" />

declare module 'monday-sdk-js' {
  interface MondaySDKInstance {
    setApiVersion(version: string): void;
    listen(
      event: string,
      callback: (res: { data: Record<string, unknown> }) => void,
    ): void;
    api(query: string, options?: { variables?: Record<string, unknown> }): Promise<{
      data: Record<string, unknown>;
    }>;
    execute(command: string, params?: Record<string, unknown>): Promise<unknown>;
    storage: {
      instance: {
        getItem(key: string): Promise<{ data: { value: string | null } }>;
        setItem(key: string, value: string): Promise<void>;
      };
    };
  }

  function init(): MondaySDKInstance;
  export default init;
}
