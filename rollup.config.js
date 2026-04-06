import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // Browser-friendly UMD build (minified)
  {
    input: 'src/index.js',
    output: {
      name: 'wxoLoader',
      file: 'dist/wxo-sdk.min.js',
      format: 'umd',
      sourcemap: true,
      globals: {
        // No external dependencies for browser build
      }
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['> 1%', 'last 2 versions', 'not dead']
            }
          }]
        ]
      }),
      production && terser({
        compress: {
          drop_console: false,
          drop_debugger: true
        },
        output: {
          comments: false
        }
      })
    ]
  },
  // Browser-friendly UMD build (non-minified for development)
  {
    input: 'src/index.js',
    output: {
      name: 'wxoLoader',
      file: 'dist/wxo-sdk.js',
      format: 'umd',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['> 1%', 'last 2 versions', 'not dead']
            }
          }]
        ]
      })
    ]
  },
  // ES module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/wxo-sdk.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              esmodules: true
            }
          }]
        ]
      })
    ]
  }
];

// Made with Bob
