import expressSession from "express-session";

const DEVIATION = 200;

const MAX_AGE = 1000 * 60 * 60 * 60 * 24 * 30; // 一个月

export class SessionStore {
  store: any = {};
  session: ReturnType<typeof expressSession>;
  duration = 60 * 60 * 60 * 2;

  constructor() {
    this.session = expressSession({
      secret: "keyboard wechatSession",
      name: "wechatSession",
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false,
        maxAge: MAX_AGE,
      },
    });
  }

  setStore(session: any) {
    this.store = session.store = {};
  }

  set(key: string, value: any, duration?: number) {
    const map = {
      value,
      time: this.createTime(duration),
    };
    this.store[key] = map;
  }

  get(key: string) {
    const currentTime = new Date().getTime();
    const data = this.store[key];

    if (data && data.time > currentTime) return this.store[key].value;
    else return null;
  }

  move(key: string) {
    this.store[key] = null;
  }

  createTime(duration?: number) {
    return (
      new Date().getTime() + (duration || this.duration - DEVIATION) * 1000
    );
  }
}

export const store = new SessionStore();

export function setupSession(app: any) {
  app.use(store.session);

  app.use("/", (req, _, next) => {
    if (!(req.session as any).store) {
      store.setStore(req.session);
    }
    next();
  });
}
