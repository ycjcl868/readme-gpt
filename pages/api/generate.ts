import { createTranslator } from 'next-intl'
import {
  OpenAIStream,
  ChatGPTCompletionRequest,
  isTurboModel
} from '../../utils/OpenAIStream'
import { verifySignature } from '../../utils/auth'

if (process.env.NEXT_PUBLIC_USE_USER_KEY !== 'true') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing env var from OpenAI')
  }
}

export const config = {
  runtime: 'edge',
  unstable_allowDynamic: ['/node_modules/js-sha256/src/sha256.js']
}

const handler = async (req: Request): Promise<Response> => {
  const { description, locale, time, sign } = (await req.json()) as {
    description: string
    locale: 'zh' | 'en'
    time: number
    sign: string
  }

  if (!process.env.OPENAI_MODEL) {
    throw new Error('Missing env var OPENAI_MODEL from OpenAI')
  }

  if (
    !(await verifySignature(
      {
        t: time,
        m: description || ''
      },
      sign
    ))
  ) {
    return new Response('Invalid signature', { status: 400 })
  }

  if (!description) {
    return new Response('No description in the request', { status: 400 })
  }

  if (!locale) {
    return new Response('No locale in the request', { status: 400 })
  }
  let messages = {}
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch (e) {
    return new Response('No locale in the request', { status: 400 })
  }

  const t = createTranslator({
    locale,
    namespace: 'Index',
    messages
  })
  const prompt = t('prompt', {
    description
  })

  const payload: ChatGPTCompletionRequest = {
    model: process.env.OPENAI_MODEL,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 1536,
    stream: true,
    n: 1,
    stop: ['<|im_end|>']
  }

  if (isTurboModel(payload.model)) {
    payload.messages = [{ role: 'user', content: prompt }]
  } else {
    payload.prompt = prompt
  }

  console.log('payload', payload)

  const { status, stream, statusText } = await OpenAIStream(payload)

  if (status !== 200) {
    return new Response(statusText, { status })
  }

  return new Response(stream)
}

export default handler
