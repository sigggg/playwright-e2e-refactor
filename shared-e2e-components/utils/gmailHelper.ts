import { google } from 'googleapis'

/**
 * Gmail OAuth2クライアントを生成する
 * 必要な環境変数: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
 */
async function createGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

/**
 * Gmail APIで条件に一致するメールを1件取得し、本文テキストを返す
 * @returns メール本文テキスト、見つからない場合はnull
 */
export async function fetchEmail(
  subject: string,
  from_address: string,
  to_address: string,
): Promise<string | null> {
  const gmail = await createGmailClient()

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: `subject:${subject} from:${from_address} to:${to_address}`,
    maxResults: 1,
  })

  const messages = res.data.messages
  if (!messages || messages.length === 0) {
    return null
  }

  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messages[0].id!,
    format: 'full',
  })

  const payload = message.data.payload
  let base64Body = ''

  if (payload?.parts) {
    const part = payload.parts.find(p => p.mimeType === 'text/plain') || payload.parts[0]
    base64Body = part.body?.data || ''
  } else if (payload?.body?.data) {
    base64Body = payload.body.data
  }

  if (!base64Body) return null

  return Buffer.from(base64Body, 'base64').toString('utf-8')
}

/**
 * 条件に一致するメールが届くまでポーリングして本文テキストを返す
 * @param subject メール件名
 * @param from_address 送信元アドレス
 * @param to_address 宛先アドレス
 * @param timeoutMs タイムアウト（ミリ秒）デフォルト15000
 * @param intervalMs ポーリング間隔（ミリ秒）デフォルト3000
 * @throws タイムアウト時にエラー
 */
export async function waitForEmail(
  subject: string,
  from_address: string,
  to_address: string,
  timeoutMs = 15000,
  intervalMs = 3000,
): Promise<string> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const content = await fetchEmail(subject, from_address, to_address)
    if (content) {
      return content
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error(
    `タイムアウト: メールが見つかりませんでした (subject: ${subject} from: ${from_address} to: ${to_address})`,
  )
}

