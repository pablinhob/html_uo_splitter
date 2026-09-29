// Reglas equivalentes a las de CLAUDE.md (guía Airbnb + normas del proyecto).
// El formato (espacios, comillas, punto y coma, 100 columnas...) lo aplica Prettier;
// aquí solo van las reglas de código. Cada bloque indica la sección de CLAUDE.md.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const codeRules = {
  // 1. Referencias y variables
  'no-var': 'error',
  'prefer-const': ['error', { destructuring: 'any' }],
  'one-var': ['error', 'never'],
  'no-multi-assign': 'error',
  'no-plusplus': 'error',
  'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
  'no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
  'no-undef': 'error',

  // 2. Objetos
  'no-object-constructor': 'error',
  'object-shorthand': ['error', 'always', { avoidQuotes: true }],
  'prefer-object-spread': 'error',
  'no-prototype-builtins': 'error',
  'prefer-object-has-own': 'error',

  // 3. Arrays
  'no-array-constructor': 'error',
  'array-callback-return': ['error', { allowImplicit: true }],

  // 4. Desestructuración
  'prefer-destructuring': [
    'error',
    {
      VariableDeclarator: { array: false, object: true },
      AssignmentExpression: { array: false, object: false },
    },
  ],

  // 5. Strings
  'prefer-template': 'error',
  'no-useless-concat': 'error',
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-useless-escape': 'error',

  // 6. Funciones (6.1: declaraciones permitidas en componentes y funciones de módulo)
  'no-inner-declarations': 'error',
  'no-new-func': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'default-param-last': 'error',
  'no-param-reassign': [
    'error',
    { props: true, ignorePropertyModificationsFor: ['event', 'acc', 'accumulator', 'camera'] },
  ],
  'no-loop-func': 'error',

  // 7. Funciones flecha
  'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
  'arrow-body-style': ['error', 'as-needed'],

  // 8. Clases
  'no-useless-constructor': 'error',
  'no-dupe-class-members': 'error',
  'class-methods-use-this': 'error',

  // 10. Iteradores y generadores
  'no-iterator': 'error',
  'no-restricted-syntax': [
    'error',
    { selector: 'ForInStatement', message: 'Usa Object.keys/values/entries (CLAUDE.md 10.1).' },
    { selector: 'ForOfStatement', message: 'Usa map/filter/reduce/forEach (CLAUDE.md 10.1).' },
    { selector: 'LabeledStatement', message: 'No uses etiquetas.' },
    { selector: 'WithStatement', message: 'No uses with.' },
    { selector: ':function[generator=true]', message: 'No uses generadores (CLAUDE.md 10.2).' },
  ],

  // 11. Propiedades
  'dot-notation': 'error',
  'prefer-exponentiation-operator': 'error',

  // 12. Comparaciones e igualdad
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-case-declarations': 'error',
  'no-nested-ternary': 'error',
  'no-unneeded-ternary': ['error', { defaultAssignment: false }],
  'no-mixed-operators': [
    'error',
    {
      groups: [
        ['%', '**'],
        ['%', '+'],
        ['%', '-'],
        ['%', '*'],
        ['%', '/'],
        ['&', '|', '<<', '>>', '>>>'],
        ['==', '!=', '===', '!=='],
        ['&&', '||'],
        ['??', '||'],
        ['??', '&&'],
      ],
      allowSamePrecedence: false,
    },
  ],

  // 13. Bloques y control de flujo
  curly: ['error', 'multi-line'],
  'no-else-return': ['error', { allowElseIf: false }],
  'no-lonely-if': 'error',
  'no-unused-expressions': [
    'error',
    { allowShortCircuit: false, allowTernary: false, allowTaggedTemplates: false },
  ],

  // 17. Conversión de tipos y nombres
  radix: 'error',
  'no-new-wrappers': 'error',
  'no-restricted-globals': [
    'error',
    { name: 'isNaN', message: 'Usa Number.isNaN (CLAUDE.md 17.2).' },
    { name: 'isFinite', message: 'Usa Number.isFinite (CLAUDE.md 17.2).' },
  ],
  camelcase: ['error', { properties: 'never' }],
  'new-cap': ['error', { newIsCap: true, capIsNew: false }],
  'no-underscore-dangle': 'error',
  'id-length': ['error', { min: 2, exceptions: ['x', 'y', 'z', '_'], properties: 'never' }],

  // Buenas prácticas del proyecto
  'no-empty': ['error', { allowEmptyCatch: false }],
  'no-console': 'error',
  'no-magic-numbers': 'off',
  'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],

  // 9. Módulos
  'import/no-namespace': ['error', { ignore: ['three'] }],
  'import/no-mutable-exports': 'error',
  'import/prefer-default-export': 'error',
  'import/first': 'error',
  'import/no-duplicates': 'error',
  'import/no-webpack-loader-syntax': 'error',
  'import/extensions': [
    'error',
    'always',
    {
      pattern: { js: 'never', jsx: 'never' },
      ignorePackages: true,
      // three exige la extensión en sus módulos opcionales
      pathGroupOverrides: [{ pattern: 'three/addons/**', action: 'ignore' }],
    },
  ],
  // `?url` es una importación de Vite: devuelve la URL del fichero, no un módulo.
  'import/no-unresolved': ['error', { ignore: ['^three/addons/', '\\?url$'] }],
  'import/newline-after-import': 'error',
};

const reactRules = {
  // 18. React / JSX
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
  'react/no-multi-comp': ['error', { ignoreStateless: false }],
  'react/function-component-definition': [
    'error',
    { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
  ],
  'react/jsx-pascal-case': 'error',
  'react/jsx-boolean-value': ['error', 'never'],
  'react/self-closing-comp': 'error',
  'react/no-array-index-key': 'error',
  'react/no-string-refs': 'error',
  'react/jsx-no-useless-fragment': 'error',
  'react/jsx-props-no-spreading': 'error',
  'react/require-default-props': 'off',
};

export default [
  { ignores: ['_legacy/', 'dist/', 'node_modules/', 'tools/reference/.venv/'] },
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    settings: {
      'import/resolver': { node: { extensions: ['.js', '.jsx'] } },
    },
    rules: codeRules,
  },
  {
    files: ['**/*.jsx'],
    ...react.configs.flat.recommended,
    ...jsxA11y.flatConfigs.recommended,
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: { ...globals.browser },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { node: { extensions: ['.js', '.jsx'] } },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...reactRules,
    },
  },
  {
    // Hooks/: pueden usar React y Helpers/, nunca componentes.
    files: ['src/Hooks/**/*.js'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/Components/**'], message: 'Hooks/ no importa componentes.' }] },
      ],
    },
  },
  {
    // Helpers/: lógica pura, sin React ni componentes.
    files: ['src/Helpers/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-dom'],
          patterns: [
            { group: ['**/Components/**', '**/Hooks/**'], message: 'Helpers/ no importa React.' },
          ],
        },
      ],
    },
  },
  {
    // logger.js es el único sitio que escribe en la consola del navegador.
    files: ['src/Helpers/logger.js'],
    rules: { 'no-console': 'off' },
  },
  {
    // Ficheros de configuración de herramientas (Node).
    files: ['*.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // vite y su plugin solo exponen "exports", que el resolver de import no entiende
      'import/no-unresolved': ['error', { ignore: ['^vite$', '^@vitejs/', '^vitest/'] }],
      'max-lines-per-function': 'off',
    },
  },
  {
    // Herramientas y utilidades de tests: se ejecutan en Node, no en el navegador.
    files: ['tools/**/*.js', 'tests/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.test.js'],
    rules: { 'max-lines-per-function': 'off' },
  },
  prettier,
  {
    // eslint-config-prettier desactiva estas; se reactivan porque no chocan con Prettier.
    rules: {
      curly: codeRules.curly,
      'no-mixed-operators': codeRules['no-mixed-operators'],
    },
  },
];
