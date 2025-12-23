type RequestOptions = {
	headers?: Record< string, string >;
	[ key: string ]: unknown;
};

type Middleware = ( options: RequestOptions, next: ( options: RequestOptions ) => any ) => any;

const createNonceMiddleware = ( nonce: string ) => {
	const middleware: Middleware & { nonce: string } = ( options, next ) => {
		const { headers = {} } = options;

		for ( const headerName in headers ) {
			if ( headerName.toLowerCase() === 'x-wp-nonce' && headers[ headerName ] === middleware.nonce ) {
				return next( options );
			}
		}

		return next( {
			...options,
			headers: {
				...headers,
				'X-WP-Nonce': middleware.nonce,
			},
		} );
	};

	middleware.nonce = nonce;

	return middleware;
};

export default createNonceMiddleware;
