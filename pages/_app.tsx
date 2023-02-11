import { Analytics } from '@vercel/analytics/react'
import { Provider } from 'react-wrap-balancer'
import type { AppProps } from 'next/app'
import { NextIntlProvider } from 'next-intl'
import '../styles/globals.css'
import '../styles/markdown.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NextIntlProvider messages={pageProps.messages}>
      <Provider>
        <Component {...pageProps} />
      </Provider>
      <Analytics />
    </NextIntlProvider>
  )
}

export default MyApp
