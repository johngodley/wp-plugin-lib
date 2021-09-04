function addNonceToUrl( url, nonce ) {
	if ( url.indexOf( 'api.redirect.li' ) !== -1 ) {
		return url;
	}

	return url + ( url.indexOf( '?' ) === -1 ? '?' : '&' ) + '_wpnonce=' + encodeURIComponent( nonce );
}

function createNonceMiddleware( nonce ) {
	function middleware( options, next ) {
		return next( {
			...options,
			url: addNonceToUrl( options.url, middleware.nonce ),
		} );
	}

	middleware.nonce = nonce;

	return middleware;
}

export default createNonceMiddleware;
