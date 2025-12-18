import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { getWordPressUrl, getPluginPage } from '@wp-plugin-lib';

type PageRouterProps = {
	page: string;
	setPage: ( page: string ) => void;
	onPageChange: () => void;
	defaultPage: string;
	baseUrl: string;
	allowedPages: string[];
	children: ReactNode;
};

type RedirectionContext = {
	caps?: {
		pages?: string[];
	};
};

declare global {
	interface Window {
		Redirectioni10n?: RedirectionContext;
	}
}

function PageRouter( props: PageRouterProps ) {
	const { page, setPage, children, onPageChange, defaultPage, baseUrl, allowedPages } = props;
	const previousPage = useRef< string | undefined >( undefined );

	const onPageChanged = useCallback( () => {
		const resolvedAllowedPages = window.Redirectioni10n?.caps?.pages || allowedPages;
		const nextPage = getPluginPage( resolvedAllowedPages );

		setPage( nextPage );
	}, [ allowedPages, setPage ] );

	useEffect( () => {
		window.addEventListener( 'popstate', onPageChanged );

		return () => {
			window.removeEventListener( 'popstate', onPageChanged );
		};
	}, [ onPageChanged ] );

	useEffect( () => {
		onPageChange();

		if ( previousPage.current && previousPage.current !== page ) {
			history.pushState( {}, '', getWordPressUrl( { sub: page }, { sub: defaultPage }, baseUrl ) );
		}

		previousPage.current = page;
	}, [ baseUrl, defaultPage, onPageChange, page ] );

	return <>{ children }</>;
}

export default PageRouter;
