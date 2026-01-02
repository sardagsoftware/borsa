module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting
        'refactor', // Code refactoring
        'perf', // Performance improvement
        'test', // Tests
        'chore', // Build/tooling
        'ci', // CI/CD
        'security', // Security fixes
      ],
    ],
    'subject-case': [0],
  },
};
