const BAYER_2x2 = [
	[0, 2],
	[3, 1],
]

const BAYER_4x4 = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
]

const BAYER_8x8 = [
	[0, 48, 12, 60, 3, 51, 15, 63],
	[32, 16, 44, 28, 35, 19, 47, 31],
	[8, 56, 4, 52, 11, 59, 7, 55],
	[40, 24, 36, 20, 43, 27, 39, 23],
	[2, 50, 14, 62, 1, 49, 13, 61],
	[34, 18, 46, 30, 33, 17, 45, 29],
	[10, 58, 6, 54, 9, 57, 5, 53],
	[42, 26, 38, 22, 41, 25, 37, 21],
]

const BAYER_16x16 = [
	[0, 128, 32, 160, 8, 136, 40, 168, 2, 130, 34, 162, 10, 138, 42, 170],
	[192, 64, 224, 96, 200, 72, 232, 104, 194, 66, 226, 98, 202, 74, 234, 106],
	[48, 176, 16, 144, 56, 184, 24, 152, 50, 178, 18, 146, 58, 186, 26, 154],
	[240, 112, 208, 80, 248, 120, 216, 88, 242, 114, 210, 82, 250, 122, 218, 90],
	[12, 140, 44, 172, 4, 132, 36, 164, 14, 142, 46, 174, 6, 134, 38, 166],
	[204, 76, 236, 108, 196, 68, 228, 100, 206, 78, 238, 110, 198, 70, 230, 102],
	[60, 188, 28, 156, 52, 180, 20, 148, 62, 190, 30, 158, 54, 182, 22, 150],
	[252, 124, 220, 92, 244, 116, 212, 84, 254, 126, 222, 94, 246, 118, 214, 86],
	[3, 131, 35, 163, 11, 139, 43, 171, 1, 129, 33, 161, 9, 137, 41, 169],
	[195, 67, 227, 99, 203, 75, 235, 107, 193, 65, 225, 97, 201, 73, 233, 105],
	[51, 179, 19, 147, 59, 187, 27, 155, 49, 177, 17, 145, 57, 185, 25, 153],
	[243, 115, 211, 83, 251, 123, 219, 91, 241, 113, 209, 81, 249, 121, 217, 89],
	[15, 143, 47, 175, 7, 135, 39, 167, 13, 141, 45, 173, 5, 133, 37, 165],
	[207, 79, 239, 111, 199, 71, 231, 103, 205, 77, 237, 109, 197, 69, 229, 101],
	[63, 191, 31, 159, 55, 183, 23, 151, 61, 189, 29, 157, 53, 181, 21, 149],
	[255, 127, 223, 95, 247, 119, 215, 87, 253, 125, 221, 93, 245, 117, 213, 85],
]

const BAYER_MATRICES = {
	'2x2': BAYER_2x2,
	'4x4': BAYER_4x4,
	'8x8': BAYER_8x8,
	'16x16': BAYER_16x16,
	none: null,
}

const MATRIX = BAYER_8x8
const RGB_LEVELS = 8

const getClosestColor = (r, g, b, palette) => {
	let minDist = Infinity
	let closest = palette[0]

	for (const [pr, pg, pb] of palette) {
		const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2

		if (dist < minDist) {
			minDist = dist
			closest = [pr, pg, pb]
		}
	}

	return closest
}

const canvasToBlobURL = canvas => {
	return new Promise((resolve, reject) => {
		canvas.toBlob(blob => {
			if (blob) resolve(URL.createObjectURL(blob))
			else reject(new Error('Failed to convert canvas to blob'))
		}, 'image/png')
	})
}

const formatRawValue = rawValue => {
	const options = {
		matrix: MATRIX,
		levels: RGB_LEVELS,
		bw: false,
	}

	if (!rawValue) {
		return options
	}

	for (const token of rawValue.split(',').map(part => part.trim())) {
		if (!token) continue

		const lowerToken = token.toLowerCase()

		if (lowerToken === 'bw') {
			options.bw = true
			continue
		}

		if (/^[248]c$/.test(lowerToken) && !options.bw) {
			options.levels = Number(lowerToken[0])
			continue
		}

		const matrix = BAYER_MATRICES[lowerToken]

		if (matrix !== undefined) {
			options.matrix = matrix
		}
	}

	if (options.bw) {
		options.levels = 2
	}

	return options
}

const createDitheredBlob = async (
	img,
	scale = 1,
	matrix = BAYER_8x8,
	levels = 8,
	bw = false
) => {
	const width = Math.floor(img.naturalWidth * scale)
	const height = Math.floor(img.naturalHeight * scale)

	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height

	const ctx = canvas.getContext('2d')
	ctx.drawImage(img, 0, 0, width, height)

	const imgData = ctx.getImageData(0, 0, width, height)
	const data = imgData.data

	const step = 255 / (levels - 1)

	for (let i = 0, y = 0; y < height; y++) {
		for (let x = 0; x < width; x++, i += 4) {
			const threshold = matrix
				? (matrix[y % matrix.length][x % matrix[0].length] /
						(matrix.length * matrix[0].length) -
						0.5) *
					step
				: 0

			if (bw) {
				const gray = Math.round(
					0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
				)
				const value = Math.min(255, Math.max(0, gray + threshold))
				const quantized = Math.round(value / step) * step

				data[i] = quantized
				data[i + 1] = quantized
				data[i + 2] = quantized
				continue
			}

			for (let c = 0; c < 3; c++) {
				let value = data[i + c] + threshold
				value = Math.min(255, Math.max(0, value))
				data[i + c] = Math.round(value / step) * step
			}
		}
	}

	ctx.putImageData(imgData, 0, 0)
	return canvasToBlobURL(canvas)
}

const dither = {
	keyword: 'dither',
	processedClass: 'dither--processed',
	toggleable: true,
	formatValue: formatRawValue,
	async process(img, { value }) {
		return createDitheredBlob(img, 1, value.matrix, value.levels, value.bw)
	},
	afterApply(img, { processor }) {
		processor.enableToggle(img)
	},
}

export default dither
