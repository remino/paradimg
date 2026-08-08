import js from '@eslint/js'
import astroParser from 'astro-eslint-parser'
import astroPlugin from 'eslint-plugin-astro'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
	{
		ignores: ['.astro/**', 'deploy/**', 'dist/**', 'node_modules/**'],
	},
	js.configs.recommended,
	...astroPlugin.configs['flat/recommended'],
	{
		files: ['**/*.{js,mjs,cjs}'],
		languageOptions: { globals: globals.browser, sourceType: 'module' },
	},
	{
		files: ['bin/**/*.mjs'],
		languageOptions: { globals: globals.node, sourceType: 'module' },
	},
	{
		files: ['src/**/*.astro'],
		languageOptions: {
			parser: astroParser,
			globals: { ...globals.browser, ...globals.node },
		},
	},
	prettier,
]
