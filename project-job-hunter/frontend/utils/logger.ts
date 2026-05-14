// Logger utility
export class Logger {
  private static isDev = __DEV__;

  static log(title: string, message?: any, data?: any) {
    if (this.isDev) {
      console.log(`[${title}]`, message, data);
    }
  }

  static warn(title: string, message?: any, data?: any) {
    if (this.isDev) {
      console.warn(`[${title}]`, message, data);
    }
  }

  static error(title: string, message?: any, data?: any) {
    console.error(`[${title}]`, message, data);
  }

  static info(title: string, message?: any, data?: any) {
    if (this.isDev) {
      console.info(`[${title}]`, message, data);
    }
  }
}

export default Logger;