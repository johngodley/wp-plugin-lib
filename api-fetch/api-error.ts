type JsonError = {
	message?: string;
	error_code?: string;
	code?: string;
	name?: string;
	data?: { error_code?: string };
};

type ErrorLike = JsonError | string | number | null | undefined | Record< string, unknown >;

const isJsonError = ( value: ErrorLike ): value is JsonError => typeof value === 'object' && value !== null;

export const getErrorMessage = ( json: ErrorLike ): string => {
	if ( json === 0 ) {
		return 'Admin AJAX returned 0';
	}

	if ( typeof json === 'string' ) {
		return json;
	}

	if ( isJsonError( json ) && json.message ) {
		return json.message;
	}

	// eslint-disable-next-line no-console
	console.error( json );
	return 'Unknown error ' + ( isJsonError( json ) ? Object.keys( json ) : json );
};

export const getErrorCode = ( json: ErrorLike ): string => {
	if ( typeof json === 'number' ) {
		return `${ json }`;
	}

	if ( isJsonError( json ) && json.error_code ) {
		return json.error_code;
	}

	if ( isJsonError( json ) && json.code ) {
		return json.code;
	}

	if ( isJsonError( json ) && json.name ) {
		return json.name;
	}

	if ( isJsonError( json ) && json.data?.error_code ) {
		return json.data.error_code;
	}

	return String( json );
};
