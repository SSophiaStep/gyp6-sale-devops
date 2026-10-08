import eslintConfig from '@gyp6.sale/core/config/frontend/eslint';

const base = Array.isArray(eslintConfig) ? eslintConfig : [eslintConfig];

const config = [
  ...base,
  {
    // Legacy code: reported as warnings, to be fixed gradually
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
];

export default config;