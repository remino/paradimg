import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'vite'

const root = process.cwd()
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const banner = `/*! ${pkg.name} v${pkg.version} | (c) ${new Date().getFullYear()} ${pkg.author.name} <${pkg.author.url}> | ${pkg.license} Licence */`

const buildLibrary = async ({
	entry,
	fileName,
	formats,
	minify = false,
	name,
}) =>
	build({
		configFile: false,
		publicDir: false,
		build: {
			emptyOutDir: false,
			lib: { entry, fileName, formats, name },
			minify,
			outDir: resolve(root, 'dist'),
			rollupOptions: { output: { banner } },
			sourcemap: false,
		},
	})

await rm(resolve(root, 'dist'), { force: true, recursive: true })
await mkdir(resolve(root, 'dist'), { recursive: true })

await buildLibrary({
	entry: resolve(root, 'src/lib/paradimg.js'),
	fileName: format => (format === 'es' ? 'paradimg.mjs' : 'paradimg.cjs'),
	formats: ['es', 'cjs'],
})

await buildLibrary({
	entry: resolve(root, 'src/lib/auto.js'),
	fileName: format =>
		format === 'es' ? 'paradimg-auto.mjs' : 'paradimg-auto.cjs',
	formats: ['es', 'cjs'],
})

await buildLibrary({
	entry: resolve(root, 'src/lib/auto.js'),
	fileName: () => 'paradimg-auto.min.js',
	formats: ['iife'],
	minify: true,
	name: 'paradimg',
})

await Promise.all(
	(await readdir(resolve(root, 'dist')))
		.filter(fileName => /\.(?:cjs|mjs|js)$/.test(fileName))
		.map(async fileName => {
			const filePath = resolve(root, 'dist', fileName)
			const file = await readFile(filePath, 'utf8')
			if (!file.startsWith(banner))
				await writeFile(filePath, `${banner}\n${file}`)
		})
)
