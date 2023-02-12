import { AnimatePresence, motion } from 'framer-motion'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Toaster, toast } from 'react-hot-toast'
import { TwitterShareButton } from 'react-share'
import Balancer from 'react-wrap-balancer'
import { marked } from 'marked'
import Footer from '../components/Footer'
import Github from '../components/GitHub'

import TwitterIcon from '../components/TwitterIcon'
import Header from '../components/Header'
import LoadingDots from '../components/LoadingDots'
import ResizablePanel from '../components/ResizablePanel'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

const useUserKey = process.env.NEXT_PUBLIC_USE_USER_KEY === 'true'
const useNotice = process.env.NEXT_NOTICE === 'true'

const REQUEST_TIMEOUT = 10 * 1000 // 10s timeout

const Home: NextPage = () => {
  const t = useTranslations('Index')
  const locale = useLocale()

  const [loading, setLoading] = useState(false)
  const [chat, setChat] = useState(t('placeholder'))
  const [api_key, setAPIKey] = useState('')
  const [generatedChat, setGeneratedChat] = useState<String>('')

  console.log('Streamed response: ', generatedChat)
  console.log('locale', locale)

  useEffect(() => {
    setChat(t('placeholder'))
  }, [t('placeholder')])

  const generateChat = async (e: any) => {
    e.preventDefault()

    if (!chat) {
      return
    }

    setGeneratedChat('')
    setLoading(true)

    let response
    try {
      response = useUserKey
        ? await fetchWithTimeout('/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: REQUEST_TIMEOUT,
            body: JSON.stringify({
              chat,
              api_key,
              locale
            })
          })
        : await fetchWithTimeout('/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: REQUEST_TIMEOUT,
            body: JSON.stringify({
              chat,
              locale
            })
          })
    } catch (e: unknown) {
      console.error('[fetch ERROR]', e)
      if (e instanceof Error && e?.name === 'AbortError') {
        // timeout
        setLoading(false)
        toast.error(t('timeout'))
      }
      return
    }

    console.log('Edge function returned.')

    if (!response.ok) {
      toast.error('ERROR: ' + response.statusText)
      throw new Error(response.statusText)
    }

    // This data is a ReadableStream
    const data = response.body
    if (!data) {
      return
    }

    const reader = data.getReader()
    const decoder = new TextDecoder()
    let done = false

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value).replace('<|im_end|>', '')
      setGeneratedChat((prev) => prev + chunkValue)
    }

    setLoading(false)
  }

  const disabled = !chat

  return (
    <div className='flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen'>
      <Head>
        <title>{t('title')}</title>
        <meta name='description' content={t('description2')} />
        <meta property='og:site_name' content={t('title')} />
        <meta property='og:description' content={t('description2')} />
        <meta property='og:title' content={t('title')} />
        <meta name='twitter:card' content={t('description2')} />
        <meta name='twitter:title' content={t('title')} />
        <meta name='twitter:description' content={t('description2')} />
      </Head>

      <Header />
      <main
        className={`flex flex-1 w-full flex-col items-center justify-center px-4 mt-12`}
      >
        <div className='flex items-center justify-center mb-5'>
          <a
            className='flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 shadow-md transition-colors hover:bg-gray-100 mr-3'
            href='https://github.com/ycjcl868/readme-gpt'
            target='_blank'
            rel='noopener noreferrer'
          >
            <Github />
            <p>Star on GitHub</p>
          </a>
          <TwitterShareButton
            url={'https://readme.rustc.cloud/'}
            hashtags={['chatgpt', 'readme', 'github']}
          >
            <TwitterIcon
              className='fill-[#00aced] opacity-100 hover:opacity-80 transition-opacity'
              size={32}
            />
          </TwitterShareButton>
        </div>
        <h1 className='sm:text-6xl text-4xl max-w-2xl font-bold text-slate-900'>
          <div className='px-4 py-2 sm:mt-3 mt-8 w-full' />
          <Balancer>{t('description2')}</Balancer>
        </h1>
        <p className='text-slate-500 mt-5'>{t('slogan')}</p>
        {useNotice && <p className='text-slate-500 mt-5'>{t('notice')}</p>}
        <div className='max-w-xl w-full'>
          {useUserKey && (
            <>
              <input
                value={api_key}
                onChange={(e) => setAPIKey(e.target.value)}
                className='w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-black focus:ring-black p-2'
                placeholder={t('openaiApiKeyPlaceholder')}
              />
            </>
          )}

          <div className='flex mt-10 items-center space-x-3'>
            <Image
              src='/1-black.png'
              width={30}
              height={30}
              alt='1 icon'
              className='mb-5 sm:mb-0'
            />
            <p className='text-left font-medium'>{t('step1')} </p>
          </div>

          <textarea
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            rows={4}
            className='w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-2'
          />

          {!loading && (
            <button
              className={`rounded-xl font-medium px-4 py-2 sm:mt-5 mt-8 w-full ${
                disabled
                  ? 'cursor: not-allowed bg-[#fafafa] border border-[#eaeaea] text-[#888] filter grayscale'
                  : 'bg-black text-white hover:bg-black/80'
              }`}
              onClick={(e) => generateChat(e)}
              disabled={disabled}
            >
              {t('simplifierButton')} &rarr;
            </button>
          )}
          {loading && (
            <button
              className='bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full'
              disabled
            >
              <LoadingDots color='white' style='large' />
            </button>
          )}
          <br></br>
          <br></br>
          <div className='mt-1 items-center space-x-3'>
            <span className='text-slate-200'>
              {t('privacyPolicy1')}
              <a
                className='text-blue-200 hover:text-blue-400'
                href='https://github.com/ycjcl868/readme-gpt/blob/main/privacy.md'
                target='_blank'
                rel='noopener noreferrer'
              >
                {' '}
                {t('privacyPolicy2')}
              </a>
            </span>
          </div>
        </div>
        <Toaster
          position='top-center'
          reverseOrder={false}
          toastOptions={{ duration: 2000 }}
        />
        <hr className='h-px bg-gray-700 border-1 dark:bg-gray-700' />
        <ResizablePanel>
          <AnimatePresence mode='wait'>
            <motion.div className='space-y-10 my-10'>
              {generatedChat && (
                <>
                  <div>
                    <h2 className='sm:text-4xl text-3xl font-bold text-slate-900 mx-auto'>
                      {t('simplifiedContent')}
                    </h2>
                  </div>
                  <div className='space-y-8 flex flex-col items-center justify-center max-w-xl mx-auto'>
                    <div
                      className='bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border'
                      onClick={() => {
                        navigator.clipboard.writeText(generatedChat.trim())
                        toast(t('copyToast'), {
                          icon: '✂️'
                        })
                      }}
                    >
                      {/* <p className="sty1">{generatedChat}</p> */}
                      <p
                        className='sty1 markdown-body'
                        dangerouslySetInnerHTML={{
                          __html: marked(generatedChat.toString(), {
                            gfm: true,
                            breaks: true,
                            smartypants: true
                          })
                        }}
                      ></p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </ResizablePanel>
      </main>
      <Footer />
    </div>
  )
}

export default Home

export function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      messages: {
        ...require(`../messages/${locale}.json`)
      }
    }
  }
}
