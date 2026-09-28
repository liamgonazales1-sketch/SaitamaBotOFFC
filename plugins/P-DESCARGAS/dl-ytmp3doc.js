import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { rm } from 'fs/promises'
import { pipeline } from 'stream/promises'
import { writeAudioTags } from '../../lib/audioTags.js'

// ═══════════════════════════════════════
// 𝙰𝙿𝙸 𝙿𝚁𝙸𝙽𝙲𝙸𝙿𝙰𝙻
// ═══════════════════════════════════════

const DELIRIUS_API =
  'https://api.delirius.online/download/ytmp3'

// ═══════════════════════════════════════
// 𝙰𝙿𝙸 𝚁𝙴𝚂𝙿𝙰𝙻𝙳𝙾
// ═══════════════════════════════════════

const STELLAR_API =
  'https://api.stellarwa.xyz'

const STELLAR_KEY =
  'proyectsV2'

// ═══════════════════════════════════════
// 𝙲𝙾𝙽𝙵𝙸𝙶
// ═══════════════════════════════════════

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'

const API_TIMEOUT =
  120000

const DOWNLOAD_TIMEOUT =
  600000

// ═══════════════════════════════════════
// 𝚃𝙸𝚃𝙻𝙴 𝙲𝙻𝙴𝙰𝙽
// ═══════════════════════════════════════

function cleanTitle(value) {
  return String(
    value ||
    'YouTube Audio'
  )
    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .slice(
      0,
      100
    )
    ||
    'YouTube Audio'
}

// ═══════════════════════════════════════
// 𝙳𝙴𝙻𝙸𝚁𝙸𝚄𝚂
// ═══════════════════════════════════════

async function fetchDelirius(url) {

  const { data } =
    await axios.get(
      DELIRIUS_API,
      {
        params: {
          url
        },

        timeout:
          API_TIMEOUT,

        headers: {
          'User-Agent':
            USER_AGENT,

          Accept:
            'application/json'
        }
      }
    )

  if (
    !data?.status ||
    !data?.data?.download
  ) {
    throw new Error(
      data?.message ||
      'Delirius no devolvió una URL de descarga.'
    )
  }

  return {

    download:
      data.data.download,

    title:
      data.data.title ||
      'YouTube Audio',

    author:
      data.data.author ||
      data.data.channel ||
      'YouTube',

    image:
      data.data.image ||
      null,

    api:
      'Delirius'
  }
}

// ═══════════════════════════════════════
// 𝚂𝙰𝙸𝙰𝙿𝙸1
// 𝚁𝙴𝚂𝙿𝙰𝙻𝙳𝙾
// ═══════════════════════════════════════

async function fetchSaiAPI1(url) {

  const { data } =
    await axios.get(
      `${STELLAR_API}/dl/ytmp3`,
      {
        params: {
          url,

          key:
            STELLAR_KEY
        },

        timeout:
          API_TIMEOUT,

        headers: {
          'User-Agent':
            USER_AGENT,

          Accept:
            'application/json'
        }
      }
    )

  const info =
    data?.data ||
    data?.result ||
    data

  const download =
    info?.dl ||
    info?.download ||
    info?.url ||
    info?.downloadUrl ||
    info?.download_url ||
    info?.dl_url ||
    null

  if (!download) {
    throw new Error(
      'SaiAPI1 no devolvió una URL de descarga.'
    )
  }

  return {

    download,

    title:
      info?.title ||
      info?.name ||
      'YouTube Audio',

    author:
      info?.author ||
      info?.artist ||
      info?.channel ||
      'YouTube',

    image:
      info?.image ||
      info?.thumbnail ||
      info?.thumb ||
      null,

    api:
      'SaiAPI1'
  }
}

// ═══════════════════════════════════════
// 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙼𝙿𝟹
// ═══════════════════════════════════════

async function downloadAudio(
  downloadUrl,
  filePath
) {

  if (!downloadUrl) {
    throw new Error(
      'URL de descarga vacía.'
    )
  }

  const response =
    await axios.get(
      downloadUrl,
      {
        responseType:
          'stream',

        timeout:
          DOWNLOAD_TIMEOUT,

        maxContentLength:
          Infinity,

        maxBodyLength:
          Infinity,

        headers: {
          'User-Agent':
            USER_AGENT,

          Accept:
            'audio/mpeg,audio/*,*/*'
        },

        validateStatus:
          status =>
            status >= 200 &&
            status < 400
      }
    )

  await pipeline(
    response.data,

    fs.createWriteStream(
      filePath
    )
  )

  const stat =
    await fs.promises.stat(
      filePath
    )

  if (
    !stat.isFile() ||
    stat.size < 1000
  ) {
    throw new Error(
      'El archivo MP3 descargado es inválido.'
    )
  }

  return stat
}

// ═══════════════════════════════════════
// 𝙶𝙴𝚃 𝙼𝙿𝟹
//
// 1. Delirius
// 2. SaiAPI1
// ═══════════════════════════════════════

async function getMp3(
  url,
  filePath
) {

  const errors = []

  // ─────────────────────────────────────
  // 𝟷️⃣ 𝙳𝙴𝙻𝙸𝚁𝙸𝚄𝚂
  // ─────────────────────────────────────

  try {

    const media =
      await fetchDelirius(
        url
      )

    try {

      await downloadAudio(
        media.download,
        filePath
      )

      return media

    } catch (error) {

      errors.push(
        `Delirius descarga: ${error.message}`
      )
    }

  } catch (error) {

    errors.push(
      `Delirius: ${error.message}`
    )
  }

  await rm(
    filePath,
    {
      force:
        true
    }
  ).catch(() => {})

  // ─────────────────────────────────────
  // 𝟸️⃣ 𝚂𝙰𝙸𝙰𝙿𝙸1
  // ─────────────────────────────────────

  try {

    const media =
      await fetchSaiAPI1(
        url
      )

    try {

      await downloadAudio(
        media.download,
        filePath
      )

      return media

    } catch (error) {

      errors.push(
        `SaiAPI1 descarga: ${error.message}`
      )
    }

  } catch (error) {

    errors.push(
      `SaiAPI1: ${error.message}`
    )
  }

  await rm(
    filePath,
    {
      force:
        true
    }
  ).catch(() => {})

  throw new Error(
    errors.join('\n')
  )
}

// ═══════════════════════════════════════
// 𝙷𝙰𝙽𝙳𝙻𝙴𝚁
// ═══════════════════════════════════════

const handler = async (
  m,
  {
    conn,
    text,
    usedPrefix,
    command
  }
) => {

  const input =
    String(
      text ||
      ''
    ).trim()

  if (!input) {

    return m.reply(
`༺ 𝚈𝚃𝙼𝙿𝟹𝙳𝙾𝙲 ༻

✰ 𝙵𝚊𝚕𝚝𝚊 𝚎𝚕 𝚎𝚗𝚕𝚊𝚌𝚎 𝚍𝚎 𝚈𝚘𝚞𝚃𝚞𝚋𝚎.

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
${usedPrefix + command} https://youtu.be/xxxxx`
    )
  }

  await conn.sendMessage(
    m.chat,
    {
      react: {
        text:
          '⏳',

        key:
          m.key
      }
    }
  ).catch(() => {})

  const tmpDir =
    './tmp'

  await fs.promises.mkdir(
    tmpDir,
    {
      recursive:
        true
    }
  )

  const filePath =
    path.join(
      tmpDir,

      `ytmp3doc_${Date.now()}.mp3`
    )

  try {

    const ytUrl =
      input.startsWith(
        'http'
      )
        ? input
        : `https://www.youtube.com/watch?v=${encodeURIComponent(input)}`

    const media =
      await getMp3(
        ytUrl,
        filePath
      )

    const title =
      cleanTitle(
        media.title
      )

    const author =
      cleanTitle(
        media.author
      )

    // ═══════════════════════════════════
    // 𝙰𝚄𝙳𝙸𝙾 𝚃𝙰𝙶𝚂
    // ═══════════════════════════════════

    try {

      await writeAudioTags(
        filePath,
        {
          title,

          author,

          artist:
            author,

          album:
            title,

          image:
            media.image
        }
      )

    } catch {}

const caption =
`*༺═────── ✰ ──────═༻*
*༻ 𝚂𝙰𝙸𝚃𝙰𝙼𝙰𝙱𝙾𝚃 ✰*
*༺═────── ✰ ──────═༻*`
    // ═══════════════════════════════════
    // 𝙴𝙽𝚅𝙸𝙰𝚁 𝙲𝙾𝙼𝙾 𝙳𝙾𝙲𝚄𝙼𝙴𝙽𝚃𝙾
    // ═══════════════════════════════════

    await conn.sendMessage(
      m.chat,
      {
        document:
          fs.readFileSync(
            filePath
          ),

        mimetype:
          'audio/mpeg',

        fileName:
          `${title}.mp3`,

        caption
      },
      {
        quoted:
          m
      }
    )

    await conn.sendMessage(
      m.chat,
      {
        react: {
          text:
            '✅',

          key:
            m.key
        }
      }
    ).catch(() => {})

  } catch (error) {

    await conn.sendMessage(
      m.chat,
      {
        react: {
          text:
            '❌',

          key:
            m.key
        }
      }
    ).catch(() => {})

    return m.reply(
`༺ 𝚈𝚃𝙼𝙿𝟹𝙳𝙾𝙲 𝙴𝚁𝚁𝙾𝚁 ༻

✰ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚛 𝚎𝚕 𝚊𝚞𝚍𝚒𝚘.

✰ 𝙳𝚎𝚝𝚊𝚕𝚕𝚎𝚜:
${String(
  error?.message ||
  error ||
  'Error desconocido'
).slice(
  0,
  900
)}

✰ 𝙸𝚗𝚝𝚎𝚗𝚝𝚘𝚜:
• Delirius
• SaiAPI1`
    )

  } finally {

    await rm(
      filePath,
      {
        force:
          true
      }
    ).catch(() => {})
  }
}

handler.help = [
  'ytmp3doc <url>',
  'ytadoc <url>'
]

handler.tags = [
  'descargas'
]

handler.command = [
  'ytmp3doc',
  'ytadoc'
]

export default handler
