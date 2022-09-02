import jsSHA from "jssha";
// import qs from "querystring";

const createNonceStr = function () {
  return Math.random().toString(36).substr(2, 15);
};

const createTimestamp = function () {
  return parseInt(String(new Date().getTime() / 1000)) + "";
};

/**
 * @synopsis 签名算法
 *
 * @param jsapi_ticket 用于签名的 jsapi_ticket
 * @param url 用于签名的 url ，注意必须动态获取，不能 hardcode
 *
 * @returns
 */
export const createSign = function (jsapi_ticket: string, url: string) {
  const ret: any = {
    jsapi_ticket: jsapi_ticket,
    nonceStr: createNonceStr(),
    timestamp: createTimestamp(),
    url: url,
  };

  const str = raw(ret);
  const shaObj = new jsSHA(str, "TEXT");
  ret.signature = shaObj.getHash("SHA-1", "HEX");

  return ret;
};

const raw = function (args: any) {
  let keys = Object.keys(args);
  keys = keys.sort();
  const newArgs: any = {};
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  let string = "";
  for (const k in newArgs) {
    string += "&" + k + "=" + newArgs[k];
  }
  string = string.slice(1);
  return string;
};
