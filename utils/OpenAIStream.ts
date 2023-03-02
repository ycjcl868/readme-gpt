import {
  createParser,
  ParsedEvent,
  ReconnectInterval
} from 'eventsource-parser'
import type { CreateCompletionRequest } from 'openai'

export type ChatGPTAgent = 'user' | 'system'

export interface ChatGPTMessage {
  role: ChatGPTAgent
  content: string
}

export interface ChatGPTCompletionRequest extends CreateCompletionRequest {
  messages?: ChatGPTMessage[]
}

export const isTurboModel = (model: string) =>
  ['gpt-3.5-turbo', 'gpt-3.5-turbo-0301'].includes(model)

export async function OpenAIStream(payload: ChatGPTCompletionRequest) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  function randomNumberInRange(min, max) {
    // 👇️ 获取 min（含）和 max（含）之间的数字
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  var keys = process.env.OPENAI_API_KEY || ''
  const apikeys = keys?.split(',')
  const randomNumber = randomNumberInRange(0, apikeys.length - 1)
  const newapikey = apikeys[randomNumber]

  let counter = 0

  var openai_api_key = process.env.OPENAI_API_KEY
  openai_api_key = newapikey
  console.log('prompt', payload.prompt)
  console.log('message', payload.messages)

  function checkString(str: string) {
    var pattern = /^sk-[A-Za-z0-9]{48}$/
    return pattern.test(str)
  }
  if (!checkString(openai_api_key)) {
    throw new Error('OpenAI API Key Format Error')
  }

  const res = await fetch(
    'https://api.openai.com/v1' +
      (isTurboModel(payload.model) ? '/chat/completions' : '/completions'),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openai_api_key ?? ''}`
      },
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )

  console.log('status', res.status, 'statusText', res?.statusText)

  if (res.status !== 200) {
    return {
      status: res.status,
      statusText: res.statusText
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      // callback
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === 'event') {
          const data = event.data
          // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
          if (data === '[DONE]') {
            controller.close()
            return
          }
          try {
            const json = JSON.parse(data)
            let text = ''
            if (isTurboModel(payload.model)) {
              text = json.choices[0].delta.content || ''
            } else {
              text = json.choices[0].text.trim()
            }
            if (counter < 2 && (text.match(/\n/) || []).length) {
              // this is a prefix character (i.e., "\n\n"), do nothing
              return
            }
            const queue = encoder.encode(text)
            controller.enqueue(queue)
            counter++
          } catch (e) {
            console.error('e', e)
            // maybe parse error
            controller.error(e)
          }
        }
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks and invoke an event for each SSE event stream
      const parser = createParser(onParse)
      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    }
  })

  return {
    stream,
    status: 200
  }
}
