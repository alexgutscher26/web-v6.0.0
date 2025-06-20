/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    "@typescript-eslint",
    "drizzle",
    "react-hooks",
    "jsx-a11y",
    "import",
  ],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
  ],
  ignorePatterns: [
    "src/components/ui/*",
    "src/lib/utils.ts",
    "*.config.js",
    "*.config.ts",
    ".next/",
    "dist/",
    "build/",
    "node_modules/",
  ],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json",
      },
    },
    react: {
      version: "detect",
    },
  },
  rules: {
    // TypeScript Rules
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",
    "@typescript-eslint/no-unnecessary-condition": "warn",
    "@typescript-eslint/no-confusing-void-expression": [
      "error",
      { ignoreArrowShorthand: true },
    ],
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowNumber: true,
        allowBoolean: true,
        allowAny: false,
        allowNullish: true,
      },
    ],

    // Import Rules
    "import/order": [
      "warn",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "type",
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
        pathGroups: [
          {
            pattern: "react",
            group: "external",
            position: "before",
          },
          {
            pattern: "next/**",
            group: "external",
            position: "before",
          },
          {
            pattern: "@/**",
            group: "internal",
          },
        ],
        pathGroupsExcludedImportTypes: ["react"],
      },
    ],
    "import/no-unused-modules": [
      "warn",
      {
        unusedExports: true,
      },
    ],
    "import/no-cycle": "error",
    "import/no-self-import": "error",

    // React Rules
    "react/jsx-curly-brace-presence": [
      "warn",
      {
        props: "never",
        children: "never",
      },
    ],
    "react/self-closing-comp": "warn",
    "react/jsx-boolean-value": ["warn", "never"],
    "react/jsx-sort-props": [
      "warn",
      {
        callbacksLast: true,
        shorthandFirst: true,
        reservedFirst: true,
      },
    ],

    // General Code Quality
    "no-console": [
      "warn",
      {
        allow: ["warn", "error"],
      },
    ],
    "prefer-const": "warn",
    "no-var": "error",
    "object-shorthand": "warn",
    "prefer-template": "warn",
    "prefer-destructuring": [
      "warn",
      {
        array: true,
        object: true,
      },
      {
        enforceForRenamedProperties: false,
      },
    ],

    // Accessibility
    "jsx-a11y/anchor-is-valid": [
      "error",
      {
        components: ["Link"],
        specialLink: ["hrefLeft", "hrefRight"],
        aspects: ["invalidHref", "preferButton"],
      },
    ],

    // Drizzle Rules
    "drizzle/enforce-delete-with-where": [
      "error",
      {
        drizzleObjectName: ["db", "ctx.db"],
      },
    ],
    "drizzle/enforce-update-with-where": [
      "error",
      {
        drizzleObjectName: ["db", "ctx.db"],
      },
    ],
  },
  overrides: [
    // API Routes
    {
      files: ["src/app/api/**/*.ts"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
      },
    },
    // Test Files
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      env: {
        jest: true,
      },
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
    // Config Files
    {
      files: ["*.config.js", "*.config.ts"],
      env: {
        node: true,
      },
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "import/no-anonymous-default-export": "off",
      },
    },
    // Component Files
    {
      files: ["src/components/**/*.tsx"],
      rules: {
        "react/jsx-sort-props": "off", // Disable for components as it can be too strict
        "@typescript-eslint/no-empty-interface": "off",
      },
    },
    // Server Actions & Utilities
    {
      files: ["src/server/**/*.ts", "src/lib/**/*.ts"],
      rules: {
        "@typescript-eslint/require-await": "error", // Enforce for server code
      },
    },
  ],
};

module.exports = config;