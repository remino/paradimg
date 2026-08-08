import { parseHashFlags } from '../../src/lib/paradimg.js'

describe('parseHashFlags', () => {
	it('reads URL fragment modifiers in order', () => {
		globalThis.window = { location: { href: 'https://example.test/' } }

		expect(parseHashFlags('image.png#?half&dither=4x4,8c')).toEqual([
			{ keyword: 'half', rawValue: null },
			{ keyword: 'dither', rawValue: '4x4,8c' },
		])
	})
})
