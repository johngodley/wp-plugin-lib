import * as qs from 'qs';
import equal from 'deep-equal';

type QueryParams = Record< string, any >;

export function setPageUrl( query: QueryParams, defaults: QueryParams ) {
	const url = getWordPressUrl( query, defaults, '?' );

	if ( document.location.search !== url ) {
		history.pushState( {}, '', url );
	}
}

export function removeFromPageUrl( queryToRemove: string ) {
	const existing = getPageUrl();

	delete existing[ queryToRemove ];

	const newUrl =
		Object.keys( existing ).length === 0
			? ''
			: '?' + qs.stringify( existing, { arrayFormat: 'brackets', indices: false } );

	if ( document.location.search !== newUrl ) {
		history.pushState( {}, '', newUrl );
	}
}

export function getPageUrl( query?: string | null ) {
	return qs.parse( query ? query.slice( 1 ) : document.location.search.slice( 1 ) ) as QueryParams;
}

export function getWordPressUrl( query: QueryParams, defaults: QueryParams, url?: string ) {
	const existing = getPageUrl( url );

	for ( const param in query ) {
		const isEqual = equal( defaults[ param ], query[ param ] );

		if ( ( query[ param ] && ! isEqual ) || param === 'page' ) {
			existing[ param.toLowerCase() ] = query[ param ];
		} else if ( isEqual ) {
			delete existing[ param.toLowerCase() ];
		}
	}

	return '?' + qs.stringify( existing, { arrayFormat: 'brackets', indices: false } );
}

export function getPluginPage( allowedPages: string[], url?: string ) {
	const params = getPageUrl( url );

	if ( params.sub && allowedPages.indexOf( params.sub ) !== -1 ) {
		return params.sub;
	}

	return allowedPages[ 0 ];
}
