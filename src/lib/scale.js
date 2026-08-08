const canvasToBlobURL = canvas => {
	return new Promise((resolve, reject) => {
		canvas.toBlob(blob => {
			if (blob) resolve(URL.createObjectURL(blob))
			else reject(new Error('Failed to convert canvas to blob'))
		}, 'image/png')
	})
}

const createScaledBlob = async (img, scale, smoothing = true) => {
	const width = Math.max(1, Math.floor(img.naturalWidth * scale))
	const height = Math.max(1, Math.floor(img.naturalHeight * scale))

	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height

	const ctx = canvas.getContext('2d')
	ctx.imageSmoothingEnabled = smoothing
	ctx.imageSmoothingQuality = smoothing ? 'high' : 'low'
	ctx.drawImage(img, 0, 0, width, height)

	return canvasToBlobURL(canvas)
}

const half = {
	keyword: 'half',
	processedClass: 'half--processed',
	async process(img) {
		return createScaledBlob(img, 0.5)
	},
}

const double = {
	keyword: 'double',
	processedClass: 'double--processed',
	async process(img) {
		return createScaledBlob(img, 2, false)
	},
}

export { double, half }
