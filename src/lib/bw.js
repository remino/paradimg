const canvasToBlobURL = canvas => {
	return new Promise((resolve, reject) => {
		canvas.toBlob(blob => {
			if (blob) resolve(URL.createObjectURL(blob))
			else reject(new Error('Failed to convert canvas to blob'))
		}, 'image/png')
	})
}

const formatRawValue = rawValue => {
	const mode = rawValue?.toLowerCase()

	if (mode === 'invert') {
		return { mode: 'invert' }
	}

	if (mode === 'threshold' || mode === 'mono') {
		return { mode: 'threshold' }
	}

	return { mode: 'grayscale' }
}

const createBWBlob = async (img, mode = 'grayscale') => {
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
		const r = data[i]
		const g = data[i + 1]
		const b = data[i + 2]

		let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

		if (mode === 'invert') {
			gray = 255 - gray
		}

		if (mode === 'threshold') {
			gray = gray >= 128 ? 255 : 0
		}

		data[i] = gray
		data[i + 1] = gray
		data[i + 2] = gray
	}

	ctx.putImageData(imgData, 0, 0)
	return canvasToBlobURL(canvas)
}

const bw = {
	keyword: 'bw',
	processedClass: 'bw--processed',
	formatValue: formatRawValue,
	async process(img, { value }) {
		return createBWBlob(img, value.mode)
	},
}

export default bw
