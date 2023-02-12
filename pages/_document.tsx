import Document, { Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel='icon' href='/favicon.ico' />
          <link
            rel='apple-touch-icon'
            sizes='192x192'
            href='/favicon.ico'
          ></link>
          <meta property='og:image' content='/og-image.png' />
          <meta name='twitter:image' content='/og-image.png' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
