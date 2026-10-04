
import axios from 'axios'
import config from '../../config.js'


// ═══════════════════════════════════════
// ✦ SAITAMABOT • TIKTOK DOWNLOADER
// ✦ HIKARI API
// ═══════════════════════════════════════

const HIKARI_API =
  'https://hikariapi.skyultraweb.com/api/scrapers/tiktok'


const HIKARI_API_KEY =
  process.env.HIKARI_API_KEY || 'hk_live_abQitrvggZrwvQ4yN_8rwx8pj_Dy7NmDtrgMpqewG4c'


const BOT_NAME =
  config.botName ||
  '𝚂𝙰𝙸𝚃𝙰𝙼𝙰𝙱𝙾𝚃'


const API_TIMEOUT =
  120000


const DOWNLOAD_TIMEOUT =
  600000


const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'



// ═══════════════════════════════════════
// ✦ FORMATEAR DURACIÓN
// ═══════════════════════════════════════

function formatDuration(seconds) {

  const total =
    Number(seconds || 0)


  if (!total)
    return 'Desconocida'


  const minutes =
    Math.floor(
      total / 60
    )


  const secs =
    total % 60


  return `${minutes}:${String(secs).padStart(2, '0')}`
}



// ═══════════════════════════════════════
// ✦ OBTENER TIKTOK
// ═══════════════════════════════════════

async function fetchTikTok(url) {

  const response =
    await axios.get(
      HIKARI_API,
      {
        params: {
          url,
          apikey:
            HIKARI_API_KEY
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


  const json =
    response?.data


  if (
    !json?.ok ||
    json?.httpStatus !== 200 ||
    !json?.response?.success
  ) {

    throw new Error(
      json?.response?.message ||
      json?.message ||
      'HikariAPI no pudo procesar el TikTok.'
    )
  }


  const data =
    json.response?.data


  if (!data) {

    throw new Error(
      'HikariAPI no devolvió datos.'
    )
  }


  return data
}



// ═══════════════════════════════════════
// ✦ DESCARGAR ARCHIVO
// ═══════════════════════════════════════

async function downloadBuffer(url) {

  if (!url)
    throw new Error(
      'URL de descarga vacía.'
    )


  const response =
    await axios.get(
      url,
      {
        responseType:
          'arraybuffer',

        timeout:
          DOWNLOAD_TIMEOUT,

        maxContentLength:
          Infinity,

        maxBodyLength:
          Infinity,

        headers: {
          'User-Agent':
            USER_AGENT
        },

        validateStatus:
          status =>
            status >= 200 &&
            status < 400
      }
    )


  const buffer =
    Buffer.from(
      response.data
    )


  if (!buffer.length) {

    throw new Error(
      'El archivo descargado está vacío.'
    )
  }


  return buffer
}



// ═══════════════════════════════════════
// ✦ HANDLER
// ═══════════════════════════════════════

const handler = async (
  m,
  {
    conn,
    text
  }
) => {

  let url =
    String(
      text || ''
    ).trim()


  // ═════════════════════════════════════
  // ✦ URL DESDE MENSAJE CITADO
  // ═════════════════════════════════════

  if (
    !url &&
    m.quoted
  ) {

    const quotedText =
      m.quoted.body ||
      m.quoted.text ||
      ''


    const match =
      quotedText.match(
        /https?:\/\/[^\s]+/i
      )


    if (match) {

      url =
        match[0]
    }
  }


  // ═════════════════════════════════════
  // ✦ SIN URL
  // ═════════════════════════════════════

  if (!url) {

    return m.reply(
`༺═────── ✦ ──────═༻
        𝚃𝙸𝙺𝚃𝙾𝙺
༺═────── ✦ ──────═༻

╭─〔 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰𝚁 〕
│
│ ✦ Envía un enlace de TikTok.
│
│ ✧ Ejemplo:
│ https://www.tiktok.com/@usuario/video/...
│
╰───────────────

✦ ${BOT_NAME}`
    )
  }


  // ═════════════════════════════════════
  // ✦ VALIDAR URL
  // ═════════════════════════════════════

  if (
    !/tiktok\.com|vt\.tiktok\.com/i.test(url)
  ) {

    return m.reply(
`༺═────── ✦ ──────═༻
       𝙴𝚁𝚁𝙾𝚁 𝚃𝙸𝙺𝚃𝙾𝙺
༺═────── ✦ ──────═༻

✦ El enlace no parece pertenecer a TikTok.

✧ Envía un enlace válido de TikTok.

✦ ${BOT_NAME}`
    )
  }


  // ═════════════════════════════════════
  // ✦ REACCIÓN
  // ═════════════════════════════════════

  await conn.sendMessage(
    m.chat,
    {
      react: {
        text: '⏳',
        key: m.key
      }
    }
  ).catch(() => {})


  try {

    // ═══════════════════════════════════
    // ✦ HIKARI API
    // ═══════════════════════════════════

    const data =
      await fetchTikTok(
        url
      )


    // ═══════════════════════════════════
    // ✦ DATOS
    // ═══════════════════════════════════

    const title =
      data.title ||
      'TikTok'


    const author =
      data.author ||
      'Desconocido'


    const username =
      data.username
        ? `@${String(data.username).replace(/^@/, '')}`
        : 'Desconocido'


    const duration =
      formatDuration(
        data.duration
      )


    const videoUrl =
      data.nowatermark ||
      data.watermark


    const audioUrl =
      data.audio ||
      data.music?.url


    const images =
      Array.isArray(data.images)
        ? data.images.filter(Boolean)
        : []


    // ═══════════════════════════════════
    // ✦ CAPTION
    // ═══════════════════════════════════

    const caption =
`༺═────── ✦ ──────═༻
          𝚃𝙸𝙺𝚃𝙾𝙺
༺═────── ✦ ──────═༻

〔 𝙸𝙽𝙵𝙾 〕

 ✦ 𝚃í𝚝𝚞𝚕𝚘:${title}
 ✦ 𝙰𝚞𝚝𝚘𝚛: ${author}
 ✦ 𝚄𝚜𝚎𝚛𝚗𝚊𝚖𝚎:${username}
 ✦ 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:${duration}

✦ ${BOT_NAME}`


    // ═══════════════════════════════════
    // ✦ IMÁGENES
    // ═══════════════════════════════════

    if (
      images.length &&
      !videoUrl
    ) {

      for (
        let i = 0;
        i < images.length;
        i++
      ) {

        try {

          const image =
            await downloadBuffer(
              images[i]
            )


          await conn.sendMessage(
            m.chat,
            {
              image,

              caption:
                i === 0
                  ? caption
                  : ''
            },
            {
              quoted:
                m
            }
          )

        } catch (error) {

          console.error(
            '[TIKTOK IMAGE ERROR]',
            error?.message ||
            error
          )
        }
      }
    }


    // ═══════════════════════════════════
    // ✦ VIDEO SIN MARCA DE AGUA
    // ═══════════════════════════════════

    if (videoUrl) {

      const video =
        await downloadBuffer(
          videoUrl
        )


      await conn.sendMessage(
        m.chat,
        {
          video,

          mimetype:
            'video/mp4',

          caption
        },
        {
          quoted:
            m
        }
      )
    }


    // ═══════════════════════════════════
    // ✦ AUDIO
    // ═══════════════════════════════════

    if (audioUrl) {

      try {

        const audio =
          await downloadBuffer(
            audioUrl
          )


        await conn.sendMessage(
          m.chat,
          {
            audio,

            mimetype:
              'audio/mp4',

            ptt:
              false,

            fileName:
              'SaitamaBot-TikTok-Audio.mp4'
          },
          {
            quoted:
              m
          }
        )

      } catch (audioError) {

        console.error(
          '[TIKTOK AUDIO ERROR]',
          audioError?.message ||
          audioError
        )
      }
    }


    // ═══════════════════════════════════
    // ✦ COMPROBAR CONTENIDO
    // ═══════════════════════════════════

    if (
      !videoUrl &&
      !images.length &&
      !audioUrl
    ) {

      throw new Error(
        'La API no devolvió video, imágenes ni audio.'
      )
    }


    // ═══════════════════════════════════
    // ✦ REACCIÓN FINAL
    // ═══════════════════════════════════

    await conn.sendMessage(
      m.chat,
      {
        react: {
          text: '✅',
          key: m.key
        }
      }
    ).catch(() => {})


  } catch (error) {

    console.error(
      '[TIKTOK ERROR]',
      error?.message ||
      error
    )


    await conn.sendMessage(
      m.chat,
      {
        react: {
          text: '❌',
          key: m.key
        }
      }
    ).catch(() => {})


    return m.reply(
`༺═────── ✦ ──────═༻
       𝙴𝚁𝚁𝙾𝚁 𝚃𝙸𝙺𝚃𝙾𝙺
༺═────── ✦ ──────═༻

✦ No se pudo descargar el contenido.

╭─〔 𝙳𝙴𝚃𝙰𝙻𝙻𝙴 〕
│
│ ${String(
  error?.message ||
  'Error desconocido.'
).slice(0, 500)}
│
╰───────────────

✦ ${BOT_NAME}`
    )
  }
}



// ═══════════════════════════════════════
// ✦ CONFIGURACIÓN
// ═══════════════════════════════════════

handler.help = [
  'tiktok <link>'
]


handler.tags = [
  'descargas'
]


handler.command = [
  'tiktok',
  'tt',
  'ttk',
  'ttkdl',
  'tiktokdl'
]


handler.register = false


export default handler
