import { getErrorCode, getErrorMessage } from './api-error';
import createNonceMiddleware from './middlewares/nonce';
import createRootURLMiddleware from './middlewares/root-url';

type ApiFetchOptions = any;
type ApiFetchMiddleware = ( options: ApiFetchOptions, next: ( options: ApiFetchOptions ) => Promise< unknown > ) => any;
type ApiFetchFunction = {
	< T = unknown >( request: ApiFetchOptions ): Promise< T >;
	getUrl: ( url: any ) => any;
	use: ( middleware: ApiFetchMiddleware ) => void;
	createNonceMiddleware: ( nonce: any ) => any;
	createRootURLMiddleware: ( rootURL: any ) => any;
	resetMiddlewares: () => void;
	replaceRootURLMiddleware: ( rootURL: any ) => void;
	nonceMiddleware?: any;
	rootURLMiddleware?: any;
};

let middlewares: ApiFetchMiddleware[] = [];

function createApiError( code: unknown, message: unknown, request: ApiFetchOptions ) {
	return {
		code: getErrorCode( code as any ),
		message: getErrorMessage( message as any ),
		request,
		data: request.apiFetch?.data ? request.apiFetch?.data : null,
		jsonData: code && ( code as { data?: unknown } ).data ? ( code as { data?: unknown } ).data : null,
	};
}

function registerMiddleware( middleware: ApiFetchMiddleware ) {
	middlewares.unshift( middleware );
}

const checkStatus = ( response: Response ) => {
	if ( response.status >= 200 && response.status < 300 ) {
		return response;
	}

	throw response;
};

const recordResponse = ( response: Response, request: ApiFetchOptions ) => {
	request.apiFetch = {
		action: request.url.replace( /[\?&]_wpnonce=[a-f0-9]*/, '' ) + ' ' + request.method.toUpperCase(),
		body: typeof request.body === 'object' ? JSON.stringify( request.body ) : request.body,
	};
	request.headers = response.headers as any;

	if ( response.status && response.statusText !== undefined ) {
		request.apiFetch.status = response.status;
		request.apiFetch.statusText = response.statusText;
	}

	return response;
};

const recordData = ( response: unknown, request: ApiFetchOptions ) => {
	if ( request.apiFetch ) {
		request.apiFetch.data = response;
	}

	return response;
};

const checkResponse = ( response: any, request: ApiFetchOptions ) => {
	if ( response?.error || response?.error_code ) {
		throw createApiError( response as any, ( response as any ).message, request );
	}

	if ( request.apiFetch ) {
		const { status, statusText } = request.apiFetch;

		if ( response?.code && response?.message ) {
			throw createApiError( response as any, response as any, request );
		}

		if ( status !== undefined && ( status < 200 || status >= 300 ) ) {
			throw createApiError( status, statusText, request );
		}
	}

	return response;
};

function setNonce( response: Response ) {
	if ( response.headers.get( 'x-wp-nonce' ) && apiFetch.nonceMiddleware ) {
		apiFetch.nonceMiddleware.nonce = response.headers.get( 'x-wp-nonce' ) ?? apiFetch.nonceMiddleware.nonce;
	}

	return response;
}

const getResponseData = ( response: Response ) => response.text();

const parseResponse = ( response: string, request: ApiFetchOptions ) => {
	const status = request.apiFetch?.status;

	if ( response === '' && status !== undefined && ( status < 200 || status > 300 ) ) {
		return response;
	}

	try {
		const json = JSON.parse( response.replace( /\ufeff/, '' ) );

		if ( json === 0 ) {
			throw createApiError( 'json-zero', 'Failed to get data', request );
		}

		return json;
	} catch ( error: any ) {
		throw createApiError( error, ( error as any )?.message, request );
	}
};

const fetchHandler = ( request: ApiFetchOptions ) => {
	return fetch( request.url, request )
		.then( setNonce )
		.then( ( response ) => recordResponse( response, request ) )
		.then( getResponseData )
		.then( ( response ) => recordData( response, request ) )
		.then( ( response: any ) => parseResponse( response as any, request ) )
		.then( ( response: any ) => checkResponse( response, request ) );
};

const apiFetch = ( < T = unknown >( request: ApiFetchOptions ): Promise< T > => {
	const steps: ApiFetchMiddleware[] = [ ...middlewares, ( options ) => fetchHandler( options ) ];

	const createRunStep =
		( index: number ) =>
		( workingOptions: ApiFetchOptions ): Promise< unknown > => {
			const step = steps[ index ];
			if ( ! step ) {
				return Promise.reject( new Error( 'Middleware step is undefined' ) );
			}

			if ( index === steps.length - 1 ) {
				return step( workingOptions, () => Promise.resolve() );
			}

			const next = createRunStep( index + 1 );
			return step( workingOptions, next );
		};

	return new Promise< T >( ( resolve, reject ) => {
		createRunStep( 0 )( request )
			.then( ( value ) => resolve( value as T ) )
			.catch( ( error: any ) => {
				if ( error.code !== 'rest_cookie_invalid_nonce' ) {
					return reject( error );
				}

				if ( request.apiFetch?.nonceRefreshed ) {
					return reject(
						createApiError(
							'rest_cookie_invalid_nonce',
							'REST API nonce refresh was rejected after retry.',
							request
						)
					);
				}

				window
					.fetch( 'admin-ajax.php?action=rest-nonce' )
					.then( checkStatus )
					.then( getResponseData )
					.then( ( text ) => {
						if ( ! text ) {
							throw createApiError(
								'rest_cookie_invalid_nonce',
								'REST API nonce refresh failed.',
								request
							);
						}

						apiFetch.nonceMiddleware.nonce = text;
						request.apiFetch = {
							...( request.apiFetch || {} ),
							nonceRefreshed: true,
						};

						apiFetch< T >( request ).then( resolve ).catch( reject );
					} )
					.catch( reject );
			} );
	} );
} ) as ApiFetchFunction;

apiFetch.getUrl = ( url: any ) =>
	apiFetch.rootURLMiddleware( { url }, ( options: any ) =>
		apiFetch.nonceMiddleware( options, ( item: any ) => item.url )
	);
apiFetch.use = registerMiddleware;
apiFetch.createNonceMiddleware = ( nonce: any ) => {
	const middle = createNonceMiddleware( nonce );
	apiFetch.nonceMiddleware = middle;
	return middle;
};
apiFetch.createRootURLMiddleware = ( rootURL: any ) => {
	const middle = createRootURLMiddleware( rootURL );
	apiFetch.rootURLMiddleware = middle;
	return middle;
};
apiFetch.resetMiddlewares = () => {
	middlewares = [];
};
apiFetch.replaceRootURLMiddleware = ( rootURL: any ) => {
	for ( let index = 0; index < middlewares.length; index++ ) {
		if ( middlewares[ index ] === apiFetch.rootURLMiddleware ) {
			middlewares[ index ] = apiFetch.createRootURLMiddleware( rootURL );
		}
	}
};

export default apiFetch;
