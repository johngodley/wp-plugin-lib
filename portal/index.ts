import { PORTAL_WRAPPER } from '../../wp-plugin-components/constant';

export default function getPortal( portalName: string ): HTMLElement | null {
	let portal = document.getElementById( portalName );

	if ( portal === null ) {
		const wrapper = document.getElementById( PORTAL_WRAPPER );

		portal = document.createElement( 'div' );

		if ( wrapper && wrapper.parentNode ) {
			portal.setAttribute( 'id', portalName );
			wrapper.parentNode.appendChild( portal );
		}
	}

	return portal;
}
