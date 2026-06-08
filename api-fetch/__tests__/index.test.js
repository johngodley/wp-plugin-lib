import { getActionUrl } from '../index';

describe( 'getActionUrl', () => {
	test( 'removes cache-buster when it is the first query parameter', () => {
		expect( getActionUrl( 'redirection/v1/redirect/?_cb=1&foo=bar' ) ).toBe( 'redirection/v1/redirect/?foo=bar' );
	} );

	test( 'removes wpnonce and cache-buster without leaving broken separators', () => {
		expect( getActionUrl( 'redirection/v1/redirect/?_wpnonce=abc123&_cb=1&foo=bar' ) ).toBe(
			'redirection/v1/redirect/?foo=bar'
		);
	} );

	test( 'removes the query string entirely when only transient parameters remain', () => {
		expect( getActionUrl( 'redirection/v1/redirect/?_cb=1' ) ).toBe( 'redirection/v1/redirect/' );
	} );

	test( 'preserves hashes after removing transient parameters', () => {
		expect( getActionUrl( 'redirection/v1/redirect/?_cb=1&foo=bar#details' ) ).toBe(
			'redirection/v1/redirect/?foo=bar#details'
		);
	} );
} );
