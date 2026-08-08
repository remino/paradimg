const DEFAULT_SELECTOR = 'img[src*="#?"]'
const ORIGINAL_SRC_ATTR = 'data-image-processor-original-src'
const PROCESSED_SRC_ATTR = 'data-image-processor-processed-src'
const PROCESSED_CLASS = 'image-processor--processed'

export const parseHashFlags = src => {
	if (!src) return []

	const hash = new URL(src, window.location.href).hash.slice(1)

	if (!hash) return []

	const query = hash.startsWith('?') ? hash.slice(1) : hash

	return query
		.split('&')
		.map(token => {
			if (!token) return null

			const eqIndex = token.indexOf('=')
			const hasValue = eqIndex !== -1
			const keyword = decodeURIComponent(
				(hasValue ? token.slice(0, eqIndex) : token).trim()
			).trim()

			if (!keyword) return null

			return {
				keyword,
				rawValue: hasValue
					? decodeURIComponent(token.slice(eqIndex + 1).trim())
					: null,
			}
		})
		.filter(Boolean)
}

export const stripHash = src => {
	const url = new URL(src, window.location.href)
	url.hash = ''
	return url.href
}

const getHash = src => {
	return new URL(src, window.location.href).hash
}

const withOriginalHash = (src, hash) => {
	if (!hash) return stripHash(src)

	const url = new URL(src, window.location.href)
	url.hash = hash.slice(1)
	return url.href
}

const setImageDimensions = img => {
	if (!img.getAttribute('width')) img.setAttribute('width', img.naturalWidth)
	if (!img.getAttribute('height')) img.setAttribute('height', img.naturalHeight)
}

class ImageProcessor {
	constructor(plugins = [], selector = DEFAULT_SELECTOR) {
		this.selector = selector
		this.plugins = new Map()

		for (const plugin of plugins) {
			this.register(plugin)
		}
	}

	register(plugin) {
		if (!plugin || !plugin.keyword) {
			throw new Error('ImageProcessor plugins must define a keyword')
		}

		this.plugins.set(plugin.keyword, plugin)
	}

	getPlugin(keyword) {
		return this.plugins.get(keyword)
	}

	async processImage(img) {
		const source = img.dataset.imageProcessorOriginalSrc || img.src
		const originalHash = getHash(source)
		const flags = parseHashFlags(source)
		const effects = flags
			.map(flag => {
				const plugin = this.getPlugin(flag.keyword)

				if (!plugin) return null

				const value = plugin.formatValue
					? plugin.formatValue(flag.rawValue, { flag, originalSrc: source })
					: flag.rawValue

				return {
					...flag,
					plugin,
					value,
				}
			})
			.filter(Boolean)

		if (!effects.length) return false

		img.setAttribute(ORIGINAL_SRC_ATTR, source)

		let currentSrc = source

		for (const effect of effects) {
			img.src = currentSrc
			await img.decode()

			const nextSrc = await effect.plugin.process(img, {
				currentSrc,
				flag: effect,
				flags,
				originalSrc: source,
				plugin: effect.plugin,
				rawValue: effect.rawValue,
				value: effect.value,
				processor: this,
			})

			if (!nextSrc) continue

			currentSrc = withOriginalHash(nextSrc, originalHash)
		}

		img.setAttribute(PROCESSED_SRC_ATTR, currentSrc)
		img.src = currentSrc
		await img.decode()
		setImageDimensions(img)
		img.classList.add(PROCESSED_CLASS)

		for (const effect of effects) {
			const { plugin } = effect

			if (plugin.processedClass) {
				img.classList.add(plugin.processedClass)
			}

			if (plugin.afterApply) {
				await plugin.afterApply(img, {
					currentSrc,
					flag: effect,
					flags,
					originalSrc: source,
					plugin,
					rawValue: effect.rawValue,
					value: effect.value,
					processor: this,
				})
			}
		}

		return true
	}

	enableToggle(img) {
		if (img.dataset.imageProcessorToggleBound === '1') return

		img.dataset.imageProcessorToggleBound = '1'

		img.addEventListener('click', () => {
			const originalSrc = img.dataset.imageProcessorOriginalSrc
			const processedSrc = img.dataset.imageProcessorProcessedSrc

			if (!originalSrc || !processedSrc) return

			img.src = img.src === originalSrc ? processedSrc : originalSrc
		})
	}

	async processImages() {
		const images = document.querySelectorAll(this.selector)

		for (const img of images) {
			if (img.dataset.imageProcessorOriginalSrc) {
				img.src = img.dataset.imageProcessorOriginalSrc
			}

			const source = img.dataset.imageProcessorOriginalSrc || img.src
			const flags = parseHashFlags(source)

			if (!flags.some(flag => this.getPlugin(flag.keyword))) {
				continue
			}

			await this.processImage(img)
		}
	}
}

export default ImageProcessor
