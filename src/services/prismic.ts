import * as Prismic from '@prismicio/client'
import { enableAutoPreviews } from '@prismicio/next'

export function createClient(req?: unknown) {
  const client = Prismic.createClient(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  })

  enableAutoPreviews({
    client,
    req
  })

  return client
}