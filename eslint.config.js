import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      'src/spcd3.js',
      '**/src-tauri/**',
      '**/dist/**',
      '**/node_modules/**'
    ],
    languageOptions: {
      globals: {
        structuredClone: 'readonly',
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        CSS: 'readonly',
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        fetch: 'readonly'
      },
    },
  },


  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  ...tseslint.configs.recommended,

  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
  },
]
