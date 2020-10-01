import strip from '@rollup/plugin-strip';
import typescriptPlugin from 'rollup-plugin-typescript2';
import typescript from 'typescript';
import pkg from './package.json';
import copy from 'rollup-plugin-copy';

const deps = Object.keys(
  Object.assign({}, pkg.peerDependencies, pkg.dependencies),
);

/**
 * Common
 */
const commonPlugins = [
  strip({
    functions: ['debugAssert.*'],
  }),
];

/**
 * ES5 Builds
 */
const es5BuildPlugins = [
  ...commonPlugins,
  typescriptPlugin({
    typescript,
  }),
  copy({
    targets: [{ src: 'src/authentication/login.py', dest: 'dist' }],
  }),
];

const es5Builds = [
  /**
   * Node.js Build
   */
  {
    input: 'src/index.node.ts',
    output: [{ file: pkg.main, format: 'cjs', sourcemap: true }],
    plugins: es5BuildPlugins,
    external: (id) =>
      deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
  },
];

export default es5Builds;
