type ApiQuery = Record< string, unknown >;

export type ApiRequest = {
	headers: Record< string, string >;
	url: string;
	credentials: RequestCredentials;
	method: string;
	cache?: RequestCache;
	redirect?: RequestRedirect;
	body?: BodyInit | null;
	[ key: string ]: unknown;
};

/**
 * Serialize query parameters for API requests
 * Handles arrays using bracket format (source[]=post&source[]=page)
 * and nested objects using bracket syntax (filterBy[status]=enabled).
 * @param params
 */
function stringifyApiQuery( params: ApiQuery ): string {
	const urlParams = new URLSearchParams();

	function appendObject( parent: string, obj: Record< string, unknown > ) {
		for ( const subKey in obj ) {
			const subValue = obj[ subKey ];

			if ( subValue === null || subValue === undefined ) {
				continue;
			}

			if ( Array.isArray( subValue ) ) {
				for ( const item of subValue ) {
					if ( item !== null && item !== undefined ) {
						urlParams.append( `${ parent }[${ subKey }][]`, String( item ) );
					}
				}
			} else if ( typeof subValue === 'object' ) {
				appendObject( `${ parent }[${ subKey }]`, subValue as Record< string, unknown > );
			} else {
				urlParams.append( `${ parent }[${ subKey }]`, String( subValue ) );
			}
		}
	}

	for ( const key in params ) {
		const value = params[ key ];

		if ( value === null || value === undefined ) {
			continue;
		}

		if ( Array.isArray( value ) ) {
			// Use bracket format for arrays
			for ( const item of value ) {
				if ( item !== null && item !== undefined ) {
					urlParams.append( `${ key }[]`, String( item ) );
				}
			}
		} else if ( typeof value === 'object' ) {
			// Use bracket syntax for nested objects (eg filterBy[status]=enabled)
			appendObject( key, value as Record< string, unknown > );
		} else {
			urlParams.append( key, String( value ) );
		}
	}

	return urlParams.toString();
}

const getRequestString = ( path: string, params: ApiQuery = {} ) => {
	const base = path + '/';

	if ( Object.keys( params ).length > 0 ) {
		const queryString = stringifyApiQuery( params );
		if ( queryString.length > 0 ) {
			return base + ( base.indexOf( '?' ) === -1 ? '?' : '&' ) + queryString;
		}
	}

	return base;
};

const getApiHeaders = (): Record< string, string > => {
	return {
		Accept: 'application/json, */*;q=0.1',
	};
};

const postApiheaders = (): Record< string, string > => {
	return {
		'Content-Type': 'application/json; charset=utf-8',
		Accept: 'application/json, */*;q=0.1',
	};
};

export const getApiRequest = ( path: string, query: ApiQuery = {} ): ApiRequest => ( {
	headers: getApiHeaders(),
	url: getRequestString( path, { ...query, _cb: Date.now() } ),
	credentials: 'include',
	method: 'get',
	cache: 'no-store',
	redirect: 'error',
} );

export const postApiRequest = ( path: string, params: ApiQuery = {}, query: ApiQuery = {} ): ApiRequest => {
	const request: ApiRequest = {
		headers: postApiheaders(),
		url: getRequestString( path, query ),
		credentials: 'include',
		method: 'post',
		body: '{}',
	};

	if ( Object.keys( params ).length > 0 ) {
		request.body = JSON.stringify( params );
	}

	return request;
};

export const uploadApiRequest = ( path: string, params: ApiQuery, file: File | Blob ): ApiRequest => {
	const request = postApiRequest( path, params );

	delete request.headers[ 'Content-Type' ];
	const form = new FormData();
	form.append( 'file', file );
	request.body = form;

	return request;
};

export const deleteApiRequest = ( path: string, params: ApiQuery = {}, query: ApiQuery = {} ): ApiRequest =>
	postApiRequest( path, params, query );
