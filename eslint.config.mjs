import tseslint from 'typescript-eslint';
export default [
  // Ajv standalone output is machine-owned; FTG hash/drift and executable-reader tests verify it.
  { ignores:['**/.next/**','**/dist/**','**/node_modules/**','**/*.gen.ts','**/features/catalog/model/generated/read-validators.gen.cjs','**/features/catalog/model/generated/request-validators.gen.cjs','.nx/**'] },
  ...tseslint.configs.recommended,
  { files:['**/*.ts','**/*.tsx'], rules:{'@typescript-eslint/no-explicit-any':'error'} }
];
