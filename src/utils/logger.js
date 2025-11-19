/**
 * Logger utility that only logs in debug builds
 * Uses __DEV__ global which is true in debug and false in production
 */

const Logger = {
  log: (...args) => {
    if (__DEV__) {
      console.log(...args);
    }
  },

  error: (...args) => {
    if (__DEV__) {
      console.error(...args);
    }
  },

  warn: (...args) => {
    if (__DEV__) {
      console.warn(...args);
    }
  },

  info: (...args) => {
    if (__DEV__) {
      console.info(...args);
    }
  },

  debug: (...args) => {
    if (__DEV__) {
      console.debug(...args);
    }
  },
};

export default Logger;
