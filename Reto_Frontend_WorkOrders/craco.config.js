const ModuleFederationPlugin = require('webpack').container.ModuleFederationPlugin;
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Configurar publicPath para Module Federation con prefijo /notifications/
      // IMPORTANTE: En desarrollo debe ser relativo, no absoluto, para que HtmlWebpackPlugin funcione
      // Debe terminar con / para que %PUBLIC_URL% funcione correctamente
      webpackConfig.output.publicPath = '/notifications/';

      // Configurar uniqueName para Module Federation
      webpackConfig.output.uniqueName = 'ops_module_coordinator';
      // Configurar aliases de path
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@modules': path.resolve(__dirname, 'src/modules')
      };

      // Configurar sass-loader para usar la API moderna de Sass
      const sassLoaderRule = webpackConfig.module.rules.find(
        (rule) => rule.oneOf
      );

      if (sassLoaderRule && sassLoaderRule.oneOf) {
        sassLoaderRule.oneOf.forEach((rule) => {
          if (rule.use) {
            rule.use.forEach((loader) => {
              if (loader.loader && loader.loader.includes('sass-loader')) {
                loader.options = loader.options || {};
                // Usar la API moderna de Sass en lugar de legacy
                loader.options.api = 'modern';
              }
            });
          }
        });
      }

      // Configurar HtmlWebpackPlugin para que inyecte scripts correctamente con el prefijo /notifications/
      const HtmlWebpackPlugin = require('html-webpack-plugin');
      const htmlPluginIndex = webpackConfig.plugins.findIndex(
        (plugin) => plugin instanceof HtmlWebpackPlugin
      );

      if (htmlPluginIndex >= 0) {
        const htmlPlugin = webpackConfig.plugins[htmlPluginIndex];
        // Asegurar que el publicPath se use correctamente para los scripts
        htmlPlugin.options = htmlPlugin.options || {};
        // El publicPath debe terminar con / para que los scripts se carguen correctamente
        htmlPlugin.options.publicPath = '/notifications/';
        // Asegurar que el template se use correctamente
        if (!htmlPlugin.options.template) {
          htmlPlugin.options.template = path.resolve(__dirname, 'public/index.html');
        }
      }

      // Verificar que no existe ya un plugin de Module Federation
      const existingPluginIndex = webpackConfig.plugins.findIndex(
        (plugin) => plugin instanceof ModuleFederationPlugin
      );
      const mfPlugin = new ModuleFederationPlugin({
        name: 'ops_module_coordinator',
        filename: 'remoteEntry.js',
        exposes: {
          './App': './src/AppWrapper.tsx',
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: '^19.2.1',
            eager: true,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: '^19.2.1',
            eager: true,
          },
          'react-router-dom': {
            singleton: true,
            eager: true,
          },
        },
      });

      if (existingPluginIndex >= 0) {
        // Reemplazar el plugin existente
        webpackConfig.plugins[existingPluginIndex] = mfPlugin;
      } else {
        // Agregar el nuevo plugin
        webpackConfig.plugins.push(mfPlugin);
      }

      return webpackConfig;
    },
  },
  devServer: {
    port: process.env.PORT || 8081,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    hot: false,
    liveReload: false,
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
    setupMiddlewares: (middlewares, devServer) => {
      // Esta es la nueva forma de configurar middlewares
      // Reemplaza onBeforeSetupMiddleware y onAfterSetupMiddleware
      return middlewares;
    },
  },
};
