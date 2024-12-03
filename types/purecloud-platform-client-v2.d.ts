declare module 'purecloud-platform-client-v2' {
  export class ApiClient {
    constructor();
    setPersistSettings(persist: boolean, prefix?: string): void;
    setEnvironment(environment: string): void;
    loginImplicitGrant(clientId: string, redirectUri: string, options?: any): Promise<any>;
  }

  export class UsersApi {
    constructor();
    getUsersMe(): Promise<any>;
  }

  const platformClient: {
    ApiClient: typeof ApiClient;
    UsersApi: typeof UsersApi;
  };

  export default platformClient;
}
