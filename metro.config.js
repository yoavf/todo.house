const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// Add .mjs support for Tamagui
config.resolver.sourceExts.push('mjs');

const { withTamagui } = require('@tamagui/metro-plugin');
module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
  outputCSS: './tamagui-web.css',
});