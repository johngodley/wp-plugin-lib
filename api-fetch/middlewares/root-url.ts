type RequestOptions = {
	url: string;
	[ key: string ]: unknown;
};

type Middleware = ( options: RequestOptions, next: ( options: RequestOptions ) => any ) => any;

function removeWP( url: string ) {
	return url.replace( 'wp-json/wp-json', 'wp-json' ).replace( '=/wp-json', '=' );
}

function removeTrailingSlash( url: string ) {
	return url.replace( /\/$/, '' );
}

function removeLeadingSlash( url: string ) {
	return url.replace( /^\//, '' );
}

function convertParams( root: string, url: string ) {
	if ( root.indexOf( '?' ) !== -1 ) {
		return url.replace( '?', '&' );
	}

	return url;
}

function addRoute( base: string, route: string ) {
	return base + '/' + route;
}

function mergeWithRoot( root: string, url: string ) {
	return removeWP( addRoute( removeTrailingSlash( root ), convertParams( root, removeLeadingSlash( url ) ) ) );
}

function createRootURLMiddleware( rootURL: string ) {
	const middleware: Middleware & { rootURL: string } = ( options, next ) => {
		if ( options.url.startsWith( 'http' ) ) {
			return next( options );
		}

		return next( {
			...options,
			url: mergeWithRoot( rootURL, options.url ),
		} );
	};

	middleware.rootURL = rootURL;

	return middleware;
}

export default createRootURLMiddleware;
