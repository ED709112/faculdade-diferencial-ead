const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  APP_NAME: 'Faculdade Diferencial EAD',
  APP_VERSION: '1.0.0',
};

export const Config = {
  ...ENV,
  isDev: process.env.NODE_ENV !== 'production',
};
