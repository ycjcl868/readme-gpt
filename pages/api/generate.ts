import { createTranslator } from 'next-intl'
import { OpenAIStream, OpenAIStreamPayload } from '../../utils/OpenAIStream'

if (process.env.NEXT_PUBLIC_USE_USER_KEY !== 'true') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing env var from OpenAI')
  }
}

export const config = {
  runtime: 'edge'
}

const handler = async (req: Request): Promise<Response> => {
  const { chat, api_key, locale } = (await req.json()) as {
    chat: string
    locale: 'zh' | 'en'
    api_key?: string
  }

  if (!process.env.OPENAI_MODEL) {
    throw new Error('Missing env var OPENAI_MODEL from OpenAI')
  }

  if (!chat) {
    return new Response('No chat in the request', { status: 400 })
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
    chat
  })

  const payload: OpenAIStreamPayload = {
    model: process.env.OPENAI_MODEL,
    prompt,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 1536,
    stream: true,
    n: 1,
    stop: ['<|im_end|>'],
    api_key
  }

  const stream = await OpenAIStream(payload)
  return new Response(stream)
}

export default handler
