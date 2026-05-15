module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Các plugin khác của bạn (nếu có)
      [
        'module-resolver',
        {
          alias: {
            '@': './',
            '@app': './app',
            '@components': './components',
            '@constants': './constants',
            '@hooks': './hooks',
            '@services': './services',
            '@store': './store',
            '@utils': './utils',
            '@assets': './assets',
          },
        },
      ],
      'react-native-reanimated/plugin', // LUÔN ĐỂ DÒNG NÀY Ở CUỐI CÙNG
    ],
  };
};
