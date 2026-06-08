import { getApiRequest } from '../api-method';

describe( 'getApiRequest', () => {
	const originalDateNow = Date.now;

	afterEach( () => {
		Date.now = originalDateNow;
	} );

	test( 'adds no-store cache mode and cache-buster to GET requests', () => {
		Date.now = jest.fn().mockReturnValue( 1234567890 );

		const request = getApiRequest( 'redirection/v1/redirect', { page: 2, orderby: 'url' } );

		expect( request.cache ).toBe( 'no-store' );
		expect( request.method ).toBe( 'get' );
		expect( request.credentials ).toBe( 'include' );
		expect( request.url ).toContain( 'redirection/v1/redirect/' );
		expect( request.url ).toContain( 'page=2' );
		expect( request.url ).toContain( 'orderby=url' );
		expect( request.url ).toContain( '_cb=1234567890' );
	} );

	test( 'adds cache-buster when no query params are provided', () => {
		Date.now = jest.fn().mockReturnValue( 42 );

		const request = getApiRequest( 'redirection/v1/plugin' );

		expect( request.url ).toBe( 'redirection/v1/plugin/?_cb=42' );
	} );
} );
