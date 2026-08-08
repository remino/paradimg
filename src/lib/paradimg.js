import ImageProcessor from './image-processor.js'
import { brightness, contrast } from './adjustments.js'
import bw from './bw.js'
import dither from './dither.js'
import { double, half } from './scale.js'

export {
	default as ImageProcessor,
	parseHashFlags,
	stripHash,
} from './image-processor.js'
export { brightness, contrast } from './adjustments.js'
export { default as bw } from './bw.js'
export { default as dither } from './dither.js'
export { double, half } from './scale.js'

export const plugins = [bw, brightness, contrast, half, double, dither]

export const createImageProcessor = (options = {}) =>
	new ImageProcessor(options.plugins ?? plugins, options.selector)

export const processImages = options =>
	createImageProcessor(options).processImages()
