# Wechat-SDK

This is the weChat sdk for typescript.

## functions

- `createMenu` create menu of the wechat public
- `getAuthWeb` get web auth url
- `getApiAccessToken` get access_token of wechat api for server
- `getUserAccessToken` get access_token of get user info
- `updateUserAccessToken` update access_token of get user info
- `getUserInfo` get user info
- `getJsApiTicket` get jsapi_ticket of wechat for provisional sign of wechat api
- `createSign` create sign of wechat config for get wechat api in web

## use

- create wechatSDK

```ts
import { WechatSDK } from "./src/wechat_sdk.ts";
// create
const wechatSDK = new WechatSDK(APP_ID, APP_SECRET);
```

- get wechat api access_token

```ts
const token = await wechat.getApiAccessToken();
```

- create menu of the wechat public

```ts
wechat.createMenu(menu_config);
```

- get wechat auth web

```ts
// redirect url
const redirectUrl = resolve(API_URL, "/wechat/login");
// wechat auth web url
const data = wechat.getAuthWeb(redirectUrl);
```

- wechat login

wechat will call this api when wechat auth web sign finished, and take along the token about user info.

```ts
const token = await wechat.createUserInfoToken(code);
const redirectUrl = `${BUSINESS_URL}?token=${token}`;
res.writeHead(302, {
  Location: redirectUrl,
});
```
