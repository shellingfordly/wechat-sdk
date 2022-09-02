import { http } from "./http";
import qs from "querystring";
import { store } from "./store";
import { OwnToken } from "./token";
import { createSign } from "./jsapi_ticket";
import {
  WECHAT_API_TOKEN,
  WECHAT_USER_TOKEN,
  WECHAT_REFRESH_TOKEN,
  WECHAT_JS_API_TICKET,
} from "./constants";
import type { AccessTokenRes, AuthScope } from "./types";

const EXPIRES_TIME = 60 * 60 * 24 * 30;

export const ownToken = new OwnToken({ expiresTime: EXPIRES_TIME });

export class WechatSDK {
  private appId: string;
  private appSecret: string;
  private baseUrl = "https://api.weixin.qq.com";
  private apiAccessToken: null | string = null;
  private userAccessToken: null | string = null;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  /**
   * @des wechat api url
   */
  private get url() {
    return {
      apiToken: `${this.baseUrl}/cgi-bin/token?`,
      userToken: `${this.baseUrl}/sns/oauth2/access_token?`,
      refreshToken: `${this.baseUrl}/sns/oauth2/refresh_token?`,
      menu: `${this.baseUrl}/cgi-bin/menu/create?`,
      userInfo: `${this.baseUrl}/sns/userinfo?`,
      redirectUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?`,
      jsApiTicket: `${this.baseUrl}/cgi-bin/ticket/getticket?`,
    };
  }

  /**
   * @des 获取接口 access_token 缓存
   */
  private get _apiAccessToken() {
    return this.apiAccessToken || store.get(WECHAT_API_TOKEN);
  }

  /**
   * @des 获取用户 access_token 缓存
   */
  private get _userAccessToken() {
    const userToken = store.get(WECHAT_USER_TOKEN);
    return userToken && userToken.access_token;
  }

  /**
   * @des 创建公众号菜单
   * @param menu
   */
  createMenu(menu: any) {
    if (!this._apiAccessToken) {
      console.log("[WechatSDK] create menu fail: access_token is undefined.");
      return;
    }
    const params = qs.stringify({ access_token: this._apiAccessToken });
    http
      .post(this.url.menu + params, JSON.stringify(menu))
      .then((response) => {
        console.log("[WechatSDK] create menu success: ", response);
      })
      .catch((error) => {
        console.log("[WechatSDK] create menu fail", error);
      });
  }

  /**
   * @des 将用户信息加密为 token 字符串
   * @param code
   * @returns
   */
  async createUserInfoToken(code: any) {
    const { openid } = await this.getUserAccessToken(code);
    const userInfo = await this.getUserInfo(openid);
    return ownToken.create(userInfo);
  }

  /**
   * @des 返回微信验证页面
   * @param redirectUri 重定向 url
   */
  getAuthWeb(redirectUrl: string, scope?: AuthScope) {
    const params = qs.stringify({
      appid: this.appId,
      redirect_uri: redirectUrl,
      response_type: "code",
      scope: scope || "snsapi_userinfo",
      state: "STATE",
    });

    return this.url.redirectUrl + `${params}#wechat_redirect`;
  }

  /**
   * @des 获取接口所需的 access_token
   * @returns access_token
   */
  async getApiAccessToken(): Promise<string> {
    if (this.apiAccessToken) return Promise.resolve(this.apiAccessToken);

    const apiAccessToken = await store.get(WECHAT_API_TOKEN);
    if (apiAccessToken) return apiAccessToken;

    const params = qs.stringify({
      grant_type: "client_credential",
      appId: this.appId,
      secret: this.appSecret,
    });

    try {
      const response = await http.get({
        url: this.url.apiToken + params,
        json: true,
      });
      const data = this.handleResult(response);
      this.apiAccessToken = data.access_token;
      store.set(WECHAT_API_TOKEN, data.access_token, data.expires_in);
      return data.access_token;
    } catch (error) {
      console.log("[WechatSDK] http apiAccessToken fail: ", error);
      return error;
    }
  }

  /**
   * @des 获取用户信息所需的 access_token
   * @param code
   * @returns access_token
   */
  async getUserAccessToken(code: any) {
    // if (this.userAccessToken) return Promise.resolve(this.userAccessToken);

    const userAccessToken = await store.get(WECHAT_USER_TOKEN);
    if (userAccessToken) return userAccessToken;

    const refreshToken = await store.get(WECHAT_REFRESH_TOKEN);
    if (refreshToken) {
      const data = await this.updateUserAccessToken(refreshToken);
      // this.userAccessToken = data.access_token;
      store.set(WECHAT_USER_TOKEN, data, data.expires_in);
      return data;
    }

    const params = qs.stringify({
      appid: this.appId,
      secret: this.appSecret,
      code,
      grant_type: "authorization_code",
    });

    try {
      const response = await http.get<AccessTokenRes>({
        url: this.url.userToken + params,
        json: true,
      });
      const data = this.handleResult(response);

      // this.userAccessToken = data.access_token;
      store.set(WECHAT_USER_TOKEN, data, data.expires_in);
      store.set(WECHAT_REFRESH_TOKEN, data.refresh_token, EXPIRES_TIME);
      return data;
    } catch (error) {
      console.log("[WechatSDK] http userAccessToken fail: ", error);
    }
  }

  /**
   * @des 更新获取用户信息所需的 access_token
   * @param code
   * @returns access_token
   */
  async updateUserAccessToken(refresh_token: string) {
    const params = qs.stringify({
      appid: this.appId,
      grant_type: "refresh_token",
      refresh_token,
    });

    const response = await http.get<AccessTokenRes>({
      url: this.url.refreshToken + params,
      json: true,
    });
    const data = this.handleResult(response);
    return data;
  }

  /**
   * @des 获取用户信息
   * @param code
   * @returns access_token
   */
  async getUserInfo(openid: string) {
    const params = qs.stringify({
      access_token: this._userAccessToken,
      openid,
      lang: "zh_CN",
    });

    const response = await http.get({
      url: this.url.userInfo + params,
      json: true,
    });

    return response;
  }

  async getJsApiTicket() {
    let accessToken = this._apiAccessToken;
    if (!accessToken) {
      accessToken = await this.getApiAccessToken();
    }

    const params = qs.stringify({
      access_token: accessToken,
      type: "jsapi",
    });

    try {
      const result = await http.get({
        url: this.url.jsApiTicket + params,
        json: true,
      });
      store.set(WECHAT_JS_API_TICKET, result.ticket, result.expires_in);
      return result.ticket;
    } catch (error) {
      console.log("[WechatSDK] get jsApiTicket fail: ", error);
    }
    return null;
  }

  async createSign(url: string) {
    const jsApiTicket = await this.getJsApiTicket();
    return { ...createSign(jsApiTicket, url), appId: this.appId };
  }

  handleResult<T = any>(data: T): T {
    return data;
  }
}
