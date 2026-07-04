import { uploadApiRequest } from './api-method';

describe( 'uploadApiRequest', () => {
	it( 'encodes array params using multipart bracket syntax', () => {
		const file = new File( [ 'source,target\n/one,/two' ], 'redirects.csv', { type: 'text/csv' } );
		const request = uploadApiRequest(
			'redirection/v1/import/file/1',
			{
				dry_run: 1,
				import_sections: [ 'groups', 'redirects' ],
			},
			file
		);

		expect( request.body ).toBeInstanceOf( FormData );

		const entries = Array.from( ( request.body as FormData ).entries() );

		expect( entries ).toEqual(
			expect.arrayContaining( [
				[ 'dry_run', '1' ],
				[ 'import_sections[]', 'groups' ],
				[ 'import_sections[]', 'redirects' ],
			] )
		);
	} );

	it( 'omits empty arrays from multipart params', () => {
		const file = new File( [ 'source,target\n/one,/two' ], 'redirects.csv', { type: 'text/csv' } );
		const request = uploadApiRequest(
			'redirection/v1/import/file/1',
			{
				import_sections: [],
			},
			file
		);

		const entries = Array.from( ( request.body as FormData ).entries() );

		expect( entries.find( ( [ key ] ) => key === 'import_sections' || key === 'import_sections[]' ) ).toBeFalsy();
	} );
} );
