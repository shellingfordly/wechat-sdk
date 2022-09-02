import request from "request";
import { Response } from "request";

export const http = {
  get<T = any>(options: string | any): Promise<T> {
    return new Promise((resolve, reject) => {
      request.get(options as string, (error, response, body) => {
        if (error) {
          return reject(error);
        }
        if (response.statusCode !== 200) {
          return reject(new Error(body));
        }
        return resolve(body);
      });
    });
  },
  post<T = any>(url: string, data: string | any): Promise<T> {
    return new Promise((resolve, reject) => {
      const form: any = {
        url: url,
      };
      if (typeof data == "string") {
        form.body = data;
      } else {
        form.formData = data;
      }
      request.post(form, (error: any, response: Response, body: any) => {
        if (error) {
          return reject(error);
        }
        if (response.statusCode !== 200) {
          return reject(new Error(body));
        }
        return resolve(body);
      });
    });
  },
};
