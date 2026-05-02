const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const isSymlink = fs.lstatSync(nodeModulesPath).isSymbolicLink();

if (isSymlink) {
  const realNodeModules = fs.realpathSync(nodeModulesPath);
  config.watchFolders = [realNodeModules];
  config.resolver.nodeModulesPaths = [realNodeModules];
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.startsWith('./opt/hostedapp')) {
      moduleName = moduleName.replace(/^\.?\//, '/');
    }
    
    // Web platformunda AdMob'u mock ile değiştir
    if (platform === 'web' && moduleName === 'react-native-google-mobile-ads') {
      return {
        filePath: path.resolve(__dirname, 'src/mocks/react-native-google-mobile-ads.web.ts'),
        type: 'sourceFile',
      };
    }
    
    // Web platformunda expo-tracking-transparency'i mock ile değiştir
    if (platform === 'web' && moduleName === 'expo-tracking-transparency') {
      return {
        filePath: path.resolve(__dirname, 'src/mocks/expo-tracking-transparency.web.ts'),
        type: 'sourceFile',
      };
    }
    
    return context.resolveRequest(context, moduleName, platform);
  };
} else {
  // Symlink değilse sadece web resolver'ı ekle
  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Web platformunda AdMob'u mock ile değiştir
    if (platform === 'web' && moduleName === 'react-native-google-mobile-ads') {
      return {
        filePath: path.resolve(__dirname, 'src/mocks/react-native-google-mobile-ads.web.ts'),
        type: 'sourceFile',
      };
    }
    
    // Web platformunda expo-tracking-transparency'i mock ile değiştir
    if (platform === 'web' && moduleName === 'expo-tracking-transparency') {
      return {
        filePath: path.resolve(__dirname, 'src/mocks/expo-tracking-transparency.web.ts'),
        type: 'sourceFile',
      };
    }
    
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;