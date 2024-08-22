import globals from 'globals'
import pluginJs from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'

export default [
  {
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: { globals: globals.browser },
  },
  stylistic.configs['recommended-flat'],
  pluginJs.configs.recommended,
]
