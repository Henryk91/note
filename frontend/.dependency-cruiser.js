module.exports = {
  forbidden: [
    /* rules from the 'recommended' preset: */
    {
      name: 'no-circular',
      severity: 'warn',
      comment:
        'This dependency is part of a circular relationship. You might want to revise ' +
        'your solution (i.e. use dependency injection, divide goals, refactor) ' +
        'to remove this circular dependency.',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      comment:
        "This is an orphan module - it's likely not used (anymore?). Either use it or " +
        "remove it. If it's logical this module is an orphan (i.e. it's a config file), " +
        "add it to your .dependency-cruiser.js's - options.doNotFollow - section.",
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$', // dot files
          '\\.d\\.ts$', // typescript declaration files
          '(^|/)tsconfig\\.json$',
          '(^|/)tslint\\.json$',
        ],
      },
      to: {},
    },
    {
      name: 'not-to-test',
      comment:
        'This module depends on code within a folder that should only contain tests. ' +
        "As tests don't implement functionality this is odd. Either you're writing " +
        "tests that import other tests (e.g. 'helpers' that should be extracted to " +
        "their own folder) or you've accidentally imported packages from your test " +
        'folder.',
      severity: 'error',
      from: {
        pathNot: '^(test|spec)',
      },
      to: {
        path: '^(test|spec)',
      },
    },
    {
      name: 'not-to-spec',
      comment:
        'This module depends on a spec (test) file. The sole responsibility of a spec file ' +
        'is to test code. If there is something in a spec that is of use to other ' +
        "modules, it doesn't have that sole responsibility anymore. Factor it out " +
        'into (e.g.) a helper.',
      severity: 'error',
      from: {},
      to: {
        path: '\\.(spec|test)\\.(js|mjs|cjs|ts|ls|coffee|litcoffee|coffee\\.md)$',
      },
    },
    /* Atomic Design Rules */
    {
      name: 'atoms-only-use-atoms',
      comment: 'Atoms should not import molecules, organisms, or pages.',
      severity: 'error',
      from: { path: '^src/components/atoms' },
      to: { path: '^src/components/(molecules|organisms|templates)|src/pages' },
    },
    {
      name: 'molecules-only-use-atoms-molecules',
      comment: 'Molecules should not import organisms or pages.',
      severity: 'error',
      from: { path: '^src/components/molecules' },
      to: { path: '^src/components/(organisms|templates)|src/pages' },
    },
    {
      name: 'organisms-only-use-components',
      comment: 'Organisms should not import pages.',
      severity: 'error',
      from: { path: '^src/components/organisms' },
      to: { path: '^src/pages' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
      dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled', 'npm-no-pkg'],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
