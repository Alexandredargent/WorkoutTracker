module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env', // Le chemin de ton fichier .env
        },
      ],
      'react-native-reanimated/plugin', // Place ce plugin ici
    ],
  };
};
