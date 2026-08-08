// @ts-check
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { unified } from '@astrojs/markdown-remark'
import compressor from 'astro-compressor'
import minifyHtml from 'astro-minify-html'
import rehypeCodeBlocks from './src/lib/rehype-code-blocks.mjs'

/*
	MODE here is available "development" because of the way config is loaded,
	no matter how --mode is set.
	<https://docs.astro.build/en/guides/environment-variables/>
*/
const root = fileURLToPath(new URL('.', import.meta.url))
const env = loadEnv(import.meta.env.MODE, root, '')

export default defineConfig({
	outDir: './deploy/public',
	site: 'https://remino.net/paradimg/',
	trailingSlash: 'always',
	markdown: {
		processor: unified({ rehypePlugins: [rehypeCodeBlocks] }),
	},
	integrations: [
		minifyHtml({
			collapseWhitespace: true,
			minifyCSS: true,
			minifyJS: true,
			removeComments: true,
		}),
		compressor({
			fileExtensions: ['.css', '.html', '.js', '.mjs', '.svg'],
		}),
	],
	build: {
		assets: 'paradimg',
	},
	server: {
		allowedHosts: env.ALLOWED_HOSTS?.split(',') ?? [],
		host: env.HOST ?? false,
		port: env.PORT ? Number(env.PORT) : 4321,
	},
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
})
