export interface DarkAuthConfig {
  appId: string;
  secret: string;
  version?: string;
  apiUrl?: string;
}

export interface DarkAuthResponse {
  success: boolean;
  message?: string;
  code?: string;
  [key: string]: any;
}

export declare class DarkAuth {
  appId: string;
  secret: string;
  version: string;
  apiUrl: string;
  sessionToken: string | null;
  hwid: string;
  user: any;
  licenseInfo: any;

  constructor(config: DarkAuthConfig);
  init(hash?: string | null): Promise<DarkAuthResponse>;
  license(key: string): Promise<DarkAuthResponse>;
  login(username: string, password: string): Promise<DarkAuthResponse>;
  register(username: string, password: string, key: string): Promise<DarkAuthResponse>;
  check(): Promise<boolean>;
  getVar(name: string): Promise<string>;
  setVar(name: string, value: string): Promise<DarkAuthResponse>;
  log(message: string, level?: string): Promise<DarkAuthResponse>;
  resetHWID(key: string): Promise<DarkAuthResponse>;
  getChat(channel?: string): Promise<any[]>;
  sendChat(sender: string, message: string, channel?: string): Promise<DarkAuthResponse>;
}

export default DarkAuth;
