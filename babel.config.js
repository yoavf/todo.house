module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-flow'
    ],
    plugins: [
      // Required for react-native-reanimated
      'react-native-reanimated/plugin',
    ],
  };
};