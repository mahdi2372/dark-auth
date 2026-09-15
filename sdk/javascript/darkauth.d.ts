/** DARK-AUTH JavaScript SDK v2.0.0 — TypeScript Definitions */

export interface DarkAuthConfig {
  appId: string;
  secret: string;
  apiUrl: string;
  version?: string;
}

export interface DarkAuthResponse {
  success: boolean;
  message?: string;
  code?: string;
  session_token?: string;
  update?: {
    available: boolean;
    latest_version?: string;
    download_url?: string;
  };
  user?: {
    username: string;
    [key: string]: unknown;
  };
  level?: number;
  status?: string;
  expires_at?: string;
  value?: string;
  messages?: ChatMessage[];
  [key: string]: unknown;
}

export interface ChatMessage {
  sender: string;
  message: string;
  channel?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ChatParams {
  session_token: string;
  channel: string;
  sender?: string;
  message?: string;
}

export declare class DarkAuth {
  appId: string;
  secret: string;
  version: string;
  apiUrl: string;
  sessionToken: string | null;
  hwid: string;
  user: Record<string, unknown> | null;
  licenseInfo: DarkAuthResponse | null;

  constructor(config: DarkAuthConfig);

  /** Initialize a session with the DARK-AUTH API. */
  init(hash?: string | null): Promise<DarkAuthResponse>;

  /** Authenticate with a license key. */
  license(key: string): Promise<DarkAuthResponse>;

  /** Log in with username and password. */
  login(username: string, password: string): Promise<DarkAuthResponse>;

  /** Register a new user account with a license key. */
  register(username: string, password: string, key: string): Promise<DarkAuthResponse>;

  /** Check if the current session is still valid. */
  check(): Promise<boolean>;

  /** Get a cloud variable value. */
  getVar(name: string): Promise<string>;

  /** Set a cloud variable value. */
  setVar(name: string, value: string): Promise<DarkAuthResponse>;

  /** Send a log entry to the API. */
  log(message: string, level?: string): Promise<DarkAuthResponse>;

  /** Request a HWID reset for a key. */
  resetHWID(key: string): Promise<DarkAuthResponse>;

  /** Get chat messages from a channel. */
  getChat(channel?: string): Promise<ChatMessage[]>;

  /** Send a chat message. */
  sendChat(sender: string, message: string, channel?: string): Promise<DarkAuthResponse>;
}

export default DarkAuth;
