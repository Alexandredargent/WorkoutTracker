
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 👇 Les lignes qui corrigent le problème (solution temporaire recommandée)
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
