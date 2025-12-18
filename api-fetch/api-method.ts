import querystring from 'qs';

type ApiQuery = Record< string, unknown >;

export type ApiRequest = {
	headers: Record< string, string >;
	url: string;
	credentials: RequestCredentials;
	method: string;
	redirect?: RequestRedirect;
	body?: BodyInit | null;
	[ key: string ]: unknown;
};

const getRequestString = ( path: string, params: ApiQuery = {} ) => {
	const base = path + '/';

	if ( Object.keys( params ).length > 0 && querystring.stringify( params ).length > 0 ) {
		return base + ( base.indexOf( '?' ) === -1 ? '?' : '&' ) + querystring.stringify( params );
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
	url: getRequestString( path, query ),
	credentials: 'include',
	method: 'get',
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
