// 動作確認用スクリプト: Gmail APIの接続・メール取得が正常に動作するかを手動で確認する
// 実行: npx tsx scripts/check-gmail.ts
import 'dotenv/config'
import { google } from 'googleapis'

async function main() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  // 最新5件を取得
  const res = await gmail.users.messages.list({ userId: 'me', maxResults: 5 })
  const messages = res.data.messages || []
  console.log(`📬 取得件数: ${messages.length}`)

  for (const msg of messages) {
    const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'metadata', metadataHeaders: ['Subject', 'From', 'To', 'Date'] })
    const headers = detail.data.payload?.headers || []
    const get = (name: string) => headers.find(h => h.name === name)?.value ?? ''
    console.log('---')
    console.log(`件名: ${get('Subject')}`)
    console.log(`From: ${get('From')}`)
    console.log(`To:   ${get('To')}`)
    console.log(`Date: ${get('Date')}`)
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
