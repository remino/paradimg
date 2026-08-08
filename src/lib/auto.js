import { processImages } from './paradimg.js'

const run = () => processImages()

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', run, { once: true })
} else {
	run()
}
