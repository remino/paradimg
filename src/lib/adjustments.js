const canvasToBlobURL = canvas => {
	return new Promise((resolve, reject) => {
		canvas.toBlob(blob => {
			if (blob) resolve(URL.createObjectURL(blob))
			else reject(new Error('Failed to convert canvas to blob'))
		}, 'image/png')
	})
}

const parseFactor = (rawValue, fallback) => {
	if (!rawValue) return fallback

	const normalized = rawValue.trim().toLowerCase()
	const numeric = Number.parseFloat(normalized)

	if (Number.isNaN(numeric)) return fallback

	return numeric
}

const createAdjustedBlob = async (img, adjustPixel) => {
	const width = img.naturalWidth
	const height = img.naturalHeight

	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height

	const ctx = canvas.getContext('2d')
	ctx.drawImage(img, 0, 0, width, height)

	const imgData = ctx.getImageData(0, 0, width, height)
	const data = imgData.data

	for (let i = 0; i < data.length; i += 4) {
		const [r, g, b] = adjustPixel(data[i], data[i + 1], data[i + 2])
		data[i] = r
		data[i + 1] = g
		data[i + 2] = b
	}

	ctx.putImageData(imgData, 0, 0)
	return canvasToBlobURL(canvas)
}

const brightness = {
	keyword: 'brightness',
	processedClass: 'brightness--processed',
	formatValue: rawValue => ({
		factor: parseFactor(rawValue, 1.15),
	}),
	async process(img, { value }) {
		return createAdjustedBlob(img, (r, g, b) => [
			Math.min(255, Math.max(0, Math.round(r * value.factor))),
			Math.min(255, Math.max(0, Math.round(g * value.factor))),
			Math.min(255, Math.max(0, Math.round(b * value.factor))),
		])
	},
}

const contrast = {
	keyword: 'contrast',
	processedClass: 'contrast--processed',
	formatValue: rawValue => ({
		factor: parseFactor(rawValue, 1.2),
	}),
	async process(img, { value }) {
		const factor = value.factor
		const midpoint = 128

		return createAdjustedBlob(img, (r, g, b) => [
			Math.min(
				255,
				Math.max(0, Math.round((r - midpoint) * factor + midpoint))
			),
			Math.min(
				255,
				Math.max(0, Math.round((g - midpoint) * factor + midpoint))
			),
			Math.min(
				255,
				Math.max(0, Math.round((b - midpoint) * factor + midpoint))
			),
		])
	},
}

export { brightness, contrast }
