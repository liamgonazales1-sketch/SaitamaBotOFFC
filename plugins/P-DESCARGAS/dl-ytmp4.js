
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { rm } from 'fs/promises'
import { pipeline } from 'stream/promises'


// ═══════════════════════════════════════
// ✰ SAITAMABOT • YOUTUBE MP4
// ✰ HIKARI API
// ═══════════════════════════════════════

const HIKARI_API =
  'https://hikariapi.skyultraweb.com/api/scrapers/youtube/video'


// Puedes poner tu clave mediante variable de entorno:
// export HIKARI_API_KEY="TU_CLAVE"
//
// O colocarla directamente aquí.
const HIKARI_API_KEY =
  process.env.HIKARI_API_KEY || 'hk_live_abQitrvggZrwvQ4yN_8rwx8pj_Dy7NmDtrgMpqewG4c'


// ═══════════════════════════════════════
// ✰ CALIDADES
// De mayor a menor
// ═══════════════════════════════════════

const QUALITIES = [
  '1080p',
  '720p',
  '480p',
  '360p',
  '240p',
  '144p'
]


const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'


const API_TIMEOUT =
  120000


const DOWNLOAD_TIMEOUT =
  600000



// ═══════════════════════════════════════
// ✰ OBTENER VIDEO DE HIKARI
// ═══════════════════════════════════════

async function fetchHikari(url) {

  let lastError = null


  // Prueba desde 1080p hasta 144p
  for (const quality of QUALITIES) {

    try {

      const response =
        await axios.get(
          HIKARI_API,
          {
            params: {
              url,
              quality,
              apikey: HIKARI_API_KEY
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


      // ═════════════════════════════════
      // ✰ VALIDAR RESPUESTA
      // ═════════════════════════════════

      if (
        !json?.ok ||
        json?.httpStatus !== 200 ||
        !json?.response?.success
      ) {

        lastError =
          new Error(
            json?.response?.message ||
            json?.message ||
            `Hikari no pudo obtener ${quality}.`
          )

        continue
      }


      const data =
        json.response?.data


      if (!data) {

        lastError =
          new Error(
            `Hikari no devolvió datos para ${quality}.`
          )

        continue
      }


      const downloadUrl =
        data.downloadUrl ||
        data.url


      if (!downloadUrl) {

        lastError =
          new Error(
            `Hikari no devolvió enlace para ${quality}.`
          )

        continue
      }


      // ═════════════════════════════════
      // ✰ CALIDAD ENCONTRADA
      // ═════════════════════════════════

      return {

        download:
          downloadUrl,

        title:
          data.filename ||
          'YouTube Video',

        quality:
          json.response?.quality ||
          quality,

        filename:
          data.filename ||
          'YouTube Video'

      }

    } catch (error) {

      lastError =
        error

      // Continúa con la siguiente calidad
      continue
    }
  }


  throw new Error(
    lastError?.message ||
    'No se pudo obtener ninguna calidad disponible.'
  )
}



// ═══════════════════════════════════════
// ✰ DESCARGAR VIDEO
// ═══════════════════════════════════════

async function downloadVideo(url) {

  if (!url) {

    throw new Error(
      'URL de descarga vacía.'
    )
  }


  const response =
    await axios.get(
      url,
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
            'video/mp4,video/*,*/*'
        },

        validateStatus:
          status =>
            status >= 200 &&
            status < 400
      }
    )


  return response.data
}



// ═══════════════════════════════════════
// ✰ NOMBRE SEGURO
// ═══════════════════════════════════════

function safeFileName(title) {

  return String(
    title ||
    'YouTube Video'
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
    'YouTube Video'
}



// ═══════════════════════════════════════
// ✰ HANDLER
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
      text || ''
    ).trim()


  // ═════════════════════════════════════
  // ✰ SIN URL
  // ═════════════════════════════════════

  if (!input) {

    return m.reply(
`༺ 𝚈𝚃𝙼𝙿𝟺 ༻

✰ 𝙵𝚊𝚕𝚝𝚊 𝚎𝚕 𝚎𝚗𝚕𝚊𝚌𝚎 𝚍𝚎 𝚈𝚘𝚞𝚃𝚞𝚋𝚎.

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
${usedPrefix + command} https://youtu.be/xxxxx`
    )
  }


  // ═════════════════════════════════════
  // ✰ REACCIÓN
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


  // ═════════════════════════════════════
  // ✰ DIRECTORIO TEMPORAL
  // ═════════════════════════════════════

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
      `ytmp4_${Date.now()}.mp4`
    )


  try {

    // ═══════════════════════════════════
    // ✰ YOUTUBE URL
    // ═══════════════════════════════════

    const ytUrl =
      input.startsWith('http')
        ? input
        : `https://www.youtube.com/watch?v=${encodeURIComponent(input)}`


    // ═══════════════════════════════════
    // ✰ HIKARI
    // ✰ BUSCA LA MEJOR CALIDAD
    // ═══════════════════════════════════

    const media =
      await fetchHikari(
        ytUrl
      )


    const title =
      safeFileName(
        media.title
      )


    // ═══════════════════════════════════
    // ✰ DESCARGAR MP4
    // ═══════════════════════════════════

    const videoStream =
      await downloadVideo(
        media.download
      )


    await pipeline(
      videoStream,
      fs.createWriteStream(
        filePath
      )
    )


    // ═══════════════════════════════════
    // ✰ COMPROBAR ARCHIVO
    // ═══════════════════════════════════

    const stat =
      await fs.promises.stat(
        filePath
      )


    if (
      !stat.isFile() ||
      stat.size <= 0
    ) {

      throw new Error(
        'El vídeo descargado está vacío.'
      )
    }


    // ═══════════════════════════════════
    // ✰ ENVIAR VIDEO
    // ✰ CAPTION = SOLO TÍTULO
    // ═══════════════════════════════════

    await conn.sendMessage(
      m.chat,
      {
        video:
          fs.readFileSync(
            filePath
          ),

        mimetype:
          'video/mp4',

        fileName:
          `${title}.mp4`,

        caption:
          media.title || title
      },
      {
        quoted:
          m
      }
    )


    // ═══════════════════════════════════
    // ✰ ÉXITO
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

    // ═══════════════════════════════════
    // ✰ ERROR
    // ═══════════════════════════════════

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
`༺ 𝚈𝚃𝙼𝙿𝟺 𝙴𝚁𝚁𝙾𝚁 ༻

✰ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚛 𝚎𝚕 𝚟í𝚍𝚎𝚘.

✰ 𝙳𝚎𝚝𝚊𝚕𝚕𝚎𝚜:
${String(
  error?.message ||
  error ||
  'Error desconocido'
).slice(0, 900)}

✰ 𝙰𝙿𝙸:
HikariAPI`
    )

  } finally {

    // ═══════════════════════════════════
    // ✰ LIMPIAR ARCHIVO TEMPORAL
    // ═══════════════════════════════════

    await rm(
      filePath,
      {
        force:
          true
      }
    ).catch(() => {})
  }
}



// ═══════════════════════════════════════
// ✰ COMANDOS
// ═══════════════════════════════════════

handler.help = [
  'ytmp4 <url>',
  'ytv <url>'
]


handler.tags = [
  'descargas'
]


handler.command = [
  'ytmp4',
  'ytv',
  'mp4yt'
]


export default handler
