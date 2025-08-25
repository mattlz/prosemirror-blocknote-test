/**
 * Application constants
 */

export const APP_NAME = 'Prosemirror BlockNote Test';

export const EDITOR_CONSTANTS = {
  AUTO_SAVE_DELAY: 2000,
  HEARTBEAT_INTERVAL: 30000,
  MAX_PRESENCE_USERS: 10,
} as const;

export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  TOPBAR_HEIGHT: 64,
  TOAST_DURATION: 5000,
} as const;

export const VALIDATION_RULES = {
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
} as const;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/docs',
  AUTH: {
    SIGNIN: '/signin',
    SIGNUP: '/signup',
  },
  DOCS: {
    LIST: '/docs',
  },
  EDITOR: {
    DETAIL: (id: string) => `/editor/${id}`,
  },
  SHARED: {
    DETAIL: (shareId: string) => `/s/${shareId}`,
  },
} as const;