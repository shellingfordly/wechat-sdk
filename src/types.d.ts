export interface AccessTokenRes {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
}

export type AuthScope = "snsapi_base" | "snsapi_userinfo";
