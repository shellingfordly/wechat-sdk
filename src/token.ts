import jwt from "jwt-simple";

export const JWT_SECRET = "WECHAT_USERINFO_TOKEN";

export const QRCODE_JWT_SECRET = "qrcode";

export class OwnToken {
  expiresTime = 60 * 60 * 24 * 7;

  constructor(params?: any) {
    if (params && params.expiresTime) {
      this.expiresTime = params.expiresTime;
    }
  }

  /**
   * @des 创建 token
   * @param options 加密对象
   * @param expires 过期时间 单位s
   * @returns token
   */
  create(options: any, expires?: number) {
    const payload = {
      ...options,
      environment: "web",
      expires: Date.now() + (expires || this.expiresTime) * 1000,
    };
    const token = jwt.encode(payload, JWT_SECRET);
    return token;
  }

  parse(token: string, jwt_secret = JWT_SECRET) {
    const decoded = jwt.decode(token, jwt_secret);
    return decoded;
  }
}
