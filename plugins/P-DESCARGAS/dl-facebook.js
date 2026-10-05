import 'dotenv/config'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

const API_URL =
  'https://hikariapi.skyultraweb.com/api/scrapers/facebook'

const API_KEY = process.env.HIKARI_API_KEY

const TMP_DIR = './tmp'

const isFacebookUrl = (url = '') => {
  return /^https?:\/\/(www\.)?(facebook\.com|fb\.watch|m\.facebook\.com)\//i.test(url)
}

const getFacebookUrl = (text = '') => {
  const match = text.match(
    /https?:\/\/(?:www\.)?(?:facebook\.com|fb\.watch|m\.facebook\.com)\/[^\s]+/i
  )

  return match ? match[0].replace(/[)\]}>.,]+$/, '') : null
}

const hikariFacebook = async (url) => {
  if (!API_KEY) {
    throw new Error(
      'No se encontró HIKARI_API_KEY en el archivo .env'
    )
  }

  const apiUrl =
    `${API_URL}?url=${encodeURIComponent(url)}`

  const response = await axios.get(apiUrl, {
    headers: {
      'X-API-Key': API_KEY,
      Accept: 'application/json'
    },
    timeout: 60000,
    validateStatus: () => true
  })

  if (response.status !== 200) {
    throw new Error(
      `Hikari respondió HTTP ${response.status}`
    )
  }

  const data = response.data

  /*
   * Hikari puede responder de estas dos formas:
   *
   * 1. {
   *   success: true,
   *   downloadUrl: "..."
   * }
   *
   * 2. {
   *   response: {
   *     success: true,
   *     downloadUrl: "..."
   *   }
   * }
   */

  const result = data?.response || data

  if (!result?.success) {
    throw new Error(
      'Hikari no pudo obtener el vídeo de Facebook'
    )
  }

  if (!result?.downloadUrl) {
    throw new Error(
      'Hikari no devolvió downloadUrl'
    )
  }

  return result.downloadUrl
}

const downloadVideo = async (url) => {
  fs.mkdirSync(TMP_DIR, { recursive: true })

  const filename =
    `facebook_${Date.now()}.mp4`

  const filePath =
    path.join(TMP_DIR, filename)

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxContentLength: 100 * 1024 * 1024,
    maxBodyLength: 100 * 1024 * 1024
  })

  fs.writeFileSync(filePath, response.data)

  return filePath
}

let handler = async (m, { conn, text }) => {
  try {
    const input = text?.trim()

    if (!input) {
      return m.reply(
        `*༺═────── ✰ ──────═༻*

*༻ 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 ✰*

*༻ 𝚄𝚜𝚘:* .fb <𝚞𝚛𝚕>

*༻ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:*
.fb https://www.facebook.com/share/r/...

*༺═────── ✰ ──────═༻*`
      )
    }

    const url = getFacebookUrl(input)

    if (!url || !isFacebookUrl(url)) {
      return m.reply(
        `*༺═────── ✰ ──────═༻*

*༻ 𝙴𝚛𝚛𝚘𝚛 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺*

✰ La URL no parece ser válida.

✰ Usa una URL pública de Facebook.

*༺═────── ✰ ──────═༻*`
      )
    }

    await conn.sendMessage(
      m.chat,
      { react: { text: '⏳', key: m.key } }
    )

    const downloadUrl = await hikariFacebook(url)

    const filePath = await downloadVideo(downloadUrl)

    const caption = '*Facebook Video*'

    await conn.sendMessage(
      m.chat,
      {
        video: fs.readFileSync(filePath),
        mimetype: 'video/mp4',
        caption
      },
      { quoted: m }
    )

    await conn.sendMessage(
      m.chat,
      { react: { text: '✅', key: m.key } }
    )

    try {
      fs.unlinkSync(filePath)
    } catch {}

  } catch (error) {
    console.error(
      '[HIKARI FACEBOOK]',
      error?.response?.data || error.message
    )

    await conn.sendMessage(
      m.chat,
      { react: { text: '❌', key: m.key } }
    )

    return m.reply(
      `*༺═────── ✰ ──────═༻*

*༻ 𝙴𝚁𝚁𝙾𝚁 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 ✰*

✰ No se pudo descargar el vídeo.

✰ Hikari no pudo procesar esta URL.

*༺═────── ✰ ──────═༻*`
    )
  }
}

handler.help = [
  'fb <url>',
  'facebook <url>'
]

handler.tags = [
  'download'
]

handler.command = [
  'fb',
  'facebook',
  'fbdl'
]

handler.register = false

export default handler
