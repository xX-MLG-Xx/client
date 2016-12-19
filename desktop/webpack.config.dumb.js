/* eslint-disable flowtype/require-valid-file-annotation */
const webpack = require('webpack')
const webpackTargetElectronRenderer = require('webpack-target-electron-renderer')
const baseConfig = require('./webpack.config.base')
const getenv = require('getenv')
const DashboardPlugin = require('webpack-dashboard/plugin')

const USING_DLL = getenv.boolish('USING_DLL', false)
const NO_SERVER = getenv.boolish('NO_SERVER', false)
const NO_SOURCE_MAPS = getenv.boolish('NO_SOURCE_MAPS', false)
const HOT = getenv.boolish('HOT', false)
const defines = {
  '__DEV__': true,
  '__SCREENSHOT__': false,
  'process.env.NODE_ENV': JSON.stringify('development'),
  '__VERSION__': JSON.stringify('Development'),
}

const config = Object.assign({}, baseConfig)

console.warn('Injecting dev defines: ', defines)

config.debug = true
config.cache = true
config.devtool = NO_SOURCE_MAPS ? undefined : 'eval-source-map'
config.pathinfo = true
config.output.publicPath = HOT ? 'http://localhost:4000/dist/' : '../dist/'

// Uncomment below to figure out packaging bugs
// config.bail = true

if (!NO_SERVER) {
  config.plugins.push(new DashboardPlugin())
}

config.plugins.push(new webpack.optimize.OccurenceOrderPlugin())

if (getenv.boolish('HOT', false)) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin())
}

config.plugins.push(
  new webpack.NoErrorsPlugin(),
  new webpack.DefinePlugin(defines)
)

if (USING_DLL) {
  config.plugins.push(
    new webpack.DllReferencePlugin({
      context: './renderer',
      manifest: require('./dll/vendor-manifest.json'),
    })
  )
}

if (getenv.boolish('HOT', false)) {
  config.entry.index = ['react-hot-loader/patch'].concat(['./renderer/dumb.js'])
  config.entry.main = []

  const HMR = 'webpack-hot-middleware/client?path=http://localhost:4000/__webpack_hmr'

  Object.keys(config.entry).forEach(k => {
    if (k !== 'main') { // node-only thread can't be hot loaded...
      config.entry[k] = [HMR].concat(config.entry[k]) // Note: all entry points need `if (module.hot) {module.hot.accept()}` to allow hot auto loads to work
    }
  })
}

if (USING_DLL) {
  // If we are running a hot server and using a DLL we want to be fast.
  // So don't waste time in building the main thread bundle in this webpack server
  delete config.entry.main
}

config.target = webpackTargetElectronRenderer(config)
module.exports = config
