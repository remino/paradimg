import { processImages } from 'paradimg'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import html from 'shiki/langs/html.mjs'
import githubDark from 'shiki/themes/github-dark.mjs'

const highlighter = createHighlighterCore({
	engine: createJavaScriptRegexEngine(),
	langs: [html],
	themes: [githubDark],
})

class CodeViewer extends HTMLElement {
	sourceValue = ''
	renderId = 0
	observer = new MutationObserver(() => {
		this.source = this.textContent ?? ''
	})

	connectedCallback() {
		this.sourceValue ||= this.textContent ?? ''
		this.observe()
		this.render()
	}

	get source() {
		return this.sourceValue
	}
	set source(value) {
		this.sourceValue = value
		this.render()
	}
	disconnectedCallback() {
		this.observer.disconnect()
	}
	observe() {
		this.observer.observe(this, {
			characterData: true,
			childList: true,
			subtree: true,
		})
	}

	async render() {
		const renderId = ++this.renderId
		const source = this.sourceValue
		this.observer.disconnect()
		this.textContent = source
		this.observe()
		try {
			const shiki = await highlighter
			const highlighted = shiki
				.codeToHtml(source, { lang: 'html', theme: 'github-dark' })
				.replace('class="shiki ', 'class="astro-code ')
			if (this.isConnected && renderId === this.renderId) {
				this.observer.disconnect()
				this.innerHTML = highlighted
				this.observe()
			}
		} catch (error) {
			console.error('Unable to highlight playground code.', error)
		}
	}
}

customElements.define('code-viewer', CodeViewer)

const image = document.querySelector('#preview')
const code = document.querySelector('#code')
const stage = document.querySelector('#stage')
const effectsSelect = document.querySelector('#effects')
const effectToAdd = document.querySelector('#effect-to-add')
const effectOptions = document.querySelector('#effect-options')
const moveUp = document.querySelector('#move-up')
const moveDown = document.querySelector('#move-down')
const deleteEffect = document.querySelector('#delete-effect')
const updateEffect = document.querySelector('#update-effect')
const addEffect = document.querySelector('#add-effect')
const defaults = () => ({
	dither: { pattern: '4x4', colours: '4c' },
	bw: { mode: '' },
	brightness: { factor: '1.15' },
	contrast: { factor: '1.2' },
	half: {},
	double: {},
})
const definitions = {
	dither: {
		label: 'Ordered dither',
		options:
			'<label><span>Pattern</span><select name="pattern"><option value="2x2">2×2</option><option value="4x4">4×4</option><option value="8x8">8×8</option><option value="16x16">16×16</option><option value="none">none</option></select></label><label><span>Colours</span><select name="colours"><option value="2c">2 colours</option><option value="4c">4 colours</option><option value="8c">8 colours</option><option value="bw">monochrome</option></select></label>',
		value: settings => `${settings.pattern},${settings.colours}`,
		description: value => {
			const [pattern, colours] = value.split(',')
			return colours
				? `${pattern} / ${colours === 'bw' ? 'monochrome' : `${colours[0]} colours`}`
				: pattern
		},
	},
	bw: {
		label: 'Black and white',
		options:
			'<label><span>Mode</span><select name="mode"><option value="">grayscale</option><option value="invert">inverted</option><option value="threshold">threshold</option></select></label>',
		value: settings => settings.mode,
		description: value => value || 'grayscale',
	},
	brightness: {
		label: 'Brightness',
		options:
			'<label><span>Factor</span><input data-setting-control="range" type="range" min="0" max="2" step="0.05" /><input data-setting-control="number" name="factor" type="number" min="0" step="0.05" /></label>',
		value: settings => settings.factor,
		description: value => value,
	},
	contrast: {
		label: 'Contrast',
		options:
			'<label><span>Factor</span><input data-setting-control="range" type="range" min="0" max="2" step="0.05" /><input data-setting-control="number" name="factor" type="number" min="0" step="0.05" /></label>',
		value: settings => settings.factor,
		description: value => value,
	},
	half: {
		label: 'Scale to half',
		options: '',
		value: () => '',
		description: () => '',
	},
	double: {
		label: 'Scale to double',
		options: '',
		value: () => '',
		description: () => '',
	},
}
let effects = [{ type: 'dither', value: '4x4,4c' }]
let settings = defaults()
let editingIndex = -1
let renderedType = effectToAdd.value
const flags = () =>
	effects.map(({ type, value }) => (value ? `${type}=${value}` : type))
const formatEffect = effect => {
	const definition = definitions[effect.type]
	const description = definition.description(effect.value)
	return description ? `${definition.label}: ${description}` : definition.label
}
const updateActions = () => {
	const index = effectsSelect.selectedIndex
	moveUp.disabled = index < 1
	moveDown.disabled = index === -1 || index === effects.length - 1
	deleteEffect.disabled = index === -1
}
const renderEffects = (selectedIndex = -1) => {
	effectsSelect.replaceChildren(
		...effects.map((effect, index) => new Option(formatEffect(effect), index))
	)
	effectsSelect.selectedIndex = selectedIndex
	updateActions()
}
const readEffectSettings = ({ type, value }) => {
	const next = defaults()[type]
	if (type === 'dither') {
		const [pattern, colours] = value.split(',')
		next.pattern = pattern || '8x8'
		next.colours = colours || '8c'
	}
	if (type === 'bw') next.mode = value
	if (type === 'brightness' || type === 'contrast') {
		next.factor = value || next.factor
	}
	return next
}
const setEditingEffect = index => {
	editingIndex = index
	const effect = effects[index]
	effectToAdd.value = effect.type
	settings[effect.type] = readEffectSettings(effect)
	renderSettings()
	updateEffect.hidden = false
}
const setAddingEffect = () => {
	editingIndex = -1
	updateEffect.hidden = true
}
const syncSettings = () =>
	effectOptions.querySelectorAll('[name]').forEach(control => {
		settings[renderedType][control.name] = control.value
	})
const renderSettings = () => {
	const type = effectToAdd.value
	renderedType = type
	const definition = definitions[type]
	effectOptions.innerHTML = `<fieldset><legend class="sr-only">Settings for ${definition.label}</legend>${definition.options}</fieldset>`
	Object.entries(settings[type]).forEach(([name, value]) => {
		effectOptions.querySelector(`[name="${name}"]`).value = value
	})
	const range = effectOptions.querySelector('[data-setting-control="range"]')
	const number = effectOptions.querySelector('[data-setting-control="number"]')
	if (range && number) range.value = number.value
}
const writeHash = () => {
	const url = new URL(window.location.href)
	const currentFlags = flags()
	url.hash = currentFlags.length ? `?${currentFlags.join('&')}` : ''
	history.replaceState(null, '', url)
}
const readHash = () => {
	const hash = location.hash.slice(1)
	if (!hash.startsWith('?')) return
	effects = hash
		.slice(1)
		.split('&')
		.flatMap(raw => {
			const index = raw.indexOf('=')
			const type = decodeURIComponent(index < 0 ? raw : raw.slice(0, index))
			return definitions[type]
				? [
						{
							type,
							value: index < 0 ? '' : decodeURIComponent(raw.slice(index + 1)),
						},
					]
				: []
		})
}
const render = async () => {
	const currentFlags = flags()
	const src = `/paradimg-demo.svg${currentFlags.length ? `#?${currentFlags.join('&')}` : ''}`
	image.removeAttribute('data-image-processor-original-src')
	image.removeAttribute('data-image-processor-processed-src')
	image.removeAttribute('width')
	image.removeAttribute('height')
	image.src = src
	code.textContent = `<script src="https://unpkg.com/paradimg@0.1.0"><\/script>\n<img src="${src}" alt="" />`
	writeHash()
	await processImages({ selector: '#preview' })
}

effectsSelect.addEventListener('change', () => {
	updateActions()
	if (effectsSelect.selectedIndex === -1) setAddingEffect()
	else setEditingEffect(effectsSelect.selectedIndex)
})
moveUp.addEventListener('click', () => {
	const index = effectsSelect.selectedIndex
	if (index < 1) return
	;[effects[index - 1], effects[index]] = [effects[index], effects[index - 1]]
	renderEffects(index - 1)
	setEditingEffect(index - 1)
	render()
})
moveDown.addEventListener('click', () => {
	const index = effectsSelect.selectedIndex
	if (index < 0 || index === effects.length - 1) return
	;[effects[index], effects[index + 1]] = [effects[index + 1], effects[index]]
	renderEffects(index + 1)
	setEditingEffect(index + 1)
	render()
})
deleteEffect.addEventListener('click', () => {
	const index = effectsSelect.selectedIndex
	if (index < 0) return
	effects.splice(index, 1)
	renderEffects()
	setAddingEffect()
	render()
})
effectToAdd.addEventListener('change', () => {
	syncSettings()
	setAddingEffect()
	renderSettings()
})
effectOptions.addEventListener('input', event => {
	const { target } = event
	if (target.dataset.settingControl === 'range') {
		effectOptions.querySelector('[data-setting-control="number"]').value =
			target.value
	}
	if (target.dataset.settingControl === 'number') {
		effectOptions.querySelector('[data-setting-control="range"]').value =
			target.value
	}
	syncSettings()
})
addEffect.addEventListener('click', () => {
	syncSettings()
	const type = effectToAdd.value
	const effect = { type, value: definitions[type].value(settings[type]) }
	effects.push(effect)
	renderEffects()
	setAddingEffect()
	render()
})
updateEffect.addEventListener('click', () => {
	if (editingIndex === -1) return
	syncSettings()
	const type = effectToAdd.value
	effects[editingIndex] = {
		type,
		value: definitions[type].value(settings[type]),
	}
	renderEffects(editingIndex)
	render()
})
document.querySelector('#reset').addEventListener('click', () => {
	effects = [{ type: 'dither', value: '4x4,4c' }]
	settings = defaults()
	effectToAdd.value = 'dither'
	renderEffects()
	setAddingEffect()
	renderSettings()
	render()
})
document
	.querySelector('#fullscreen')
	.addEventListener('click', () => stage.requestFullscreen())
document
	.querySelector('#copy')
	.addEventListener('click', () => navigator.clipboard.writeText(code.source))
readHash()
renderEffects()
renderSettings()
render()
