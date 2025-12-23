type QueryParams = Record< string, any >;

/**
 * Perform a deep equality check on two values
 * @param a - The first value to compare
 * @param b - The second value to compare
 */
function isDeepEqual( a: any, b: any ): boolean {
	if ( a === b ) {
		return true;
	}

	if ( a && b && typeof a === 'object' && typeof b === 'object' ) {
		if ( Array.isArray( a ) ) {
			if ( ! Array.isArray( b ) || a.length !== b.length ) {
				return false;
			}
			for ( let i = 0; i < a.length; i++ ) {
				if ( ! isDeepEqual( a[ i ], b[ i ] ) ) {
					return false;
				}
			}
			return true;
		}

		const keys = Object.keys( a );
		if ( keys.length !== Object.keys( b ).length ) {
			return false;
		}

		for ( const key of keys ) {
			if ( ! Object.prototype.hasOwnProperty.call( b, key ) ) {
				return false;
			}
			if ( ! isDeepEqual( a[ key ], b[ key ] ) ) {
				return false;
			}
		}

		return true;
	}

	return false;
}

/**
 * Parse a query string into an object, handling arrays
 * Supports both bracket format (source[]=post) and repeated keys (source=post&source=page)
 * @param queryString
 */
function parseQueryString( queryString: string ): QueryParams {
	const params = new URLSearchParams( queryString );
	const result: QueryParams = {};

	// Get all unique keys
	const keys = new Set< string >();
	params.forEach( ( _, key ) => keys.add( key ) );

	for ( const key of keys ) {
		// Remove brackets from key if present (e.g., "source[]" -> "source")
		const cleanKey = key.replace( /\[\]$/, '' );
		const values = params.getAll( key );

		// If multiple values, store as array; otherwise store as single value
		if ( values.length > 1 ) {
			result[ cleanKey ] = values;
		} else if ( values.length === 1 ) {
			result[ cleanKey ] = values[ 0 ];
		}
	}

	return result;
}

/**
 * Serialize an object to a query string, handling arrays
 * Uses bracket format for arrays to match WordPress conventions
 * @param params
 */
function stringifyQueryParams( params: QueryParams ): string {
	const urlParams = new URLSearchParams();

	for ( const key in params ) {
		const value = params[ key ];

		if ( value === null || value === undefined ) {
			continue;
		}

		if ( Array.isArray( value ) ) {
			// Use bracket format for arrays (source[]=post&source[]=page)
			for ( const item of value ) {
				if ( item !== null && item !== undefined ) {
					urlParams.append( `${ key }[]`, String( item ) );
				}
			}
		} else {
			urlParams.append( key, String( value ) );
		}
	}

	return urlParams.toString();
}

export function setPageUrl( query: QueryParams, defaults: QueryParams ) {
	const url = getWordPressUrl( query, defaults, '?' );

	if ( document.location.search !== url ) {
		history.pushState( {}, '', url );
	}
}

export function removeFromPageUrl( queryToRemove: string ) {
	const existing = getPageUrl();

	delete existing[ queryToRemove ];

	const newUrl = Object.keys( existing ).length === 0 ? '' : '?' + stringifyQueryParams( existing );

	if ( document.location.search !== newUrl ) {
		history.pushState( {}, '', newUrl );
	}
}

export function getPageUrl( query?: string | null ): QueryParams {
	const queryString = query ? query.slice( 1 ) : document.location.search.slice( 1 );
	return parseQueryString( queryString );
}

export function getWordPressUrl( query: QueryParams, defaults: QueryParams, url?: string ): string {
	const existing = getPageUrl( url );

	for ( const param in query ) {
		const isEqual = isDeepEqual( defaults[ param ], query[ param ] );

		if ( ( query[ param ] && ! isEqual ) || param === 'page' ) {
			existing[ param.toLowerCase() ] = query[ param ];
		} else if ( isEqual ) {
			delete existing[ param.toLowerCase() ];
		}
	}

	return '?' + stringifyQueryParams( existing );
}

export function getPluginPage( allowedPages: string[], url?: string ) {
	const params = getPageUrl( url );

	if ( params.sub && allowedPages.indexOf( params.sub ) !== -1 ) {
		return params.sub;
	}

	return allowedPages[ 0 ];
}
