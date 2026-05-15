const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for path aliases
config.resolver.alias = {
  '@': './',
  '@types': './types',
  '@constants': './constants',
  '@services': './services',
  '@hooks': './hooks',
  '@context': './context',
  '@components': './components',
  '@screens': './screens',
  '@navigation': './navigation',
  '@utils': './utils',
};

module.exports = config;
