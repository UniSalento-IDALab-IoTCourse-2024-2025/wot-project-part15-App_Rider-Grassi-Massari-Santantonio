const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);


config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer'),
  url: require.resolve('url'),
  string_decoder: require.resolve('string_decoder'),
  events: require.resolve('events'),
  process: require.resolve('process/browser'),
};


module.exports = withNativeWind(config, { input: "./global.css" });