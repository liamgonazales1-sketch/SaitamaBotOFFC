import 'dotenv/config'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

// ═══════════════════════════════════════
// ✰ SAITAMABOT • TIKTOK DOWNLOADER
// ═══════════════════════════════════════

const API_KEY = process.env.HIKARI_API_KEY

const API_URL =
  'https://hikariapi.skyultraweb.com/api/scrapers/tiktok'

const TMP_DIR = './tmp/saitamabot-tiktok'

const esperar = ms =>
  new Promise(resolve => setTimeout(resolve, ms))

// ═══════════════════════════════════════
// ✰ CARPETA TEMPORAL
// ═══════════════════════════════════════

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true })
}

// ═══════════════════════════════════════
// ✰ OBTENER TIKTOK
// ═══════════════════════════════════════

async function obtenerTikTok(url) {
  if (!API_KEY) {
    throw new Error('HIKARI_API_KEY no configurada')
  }

  const response = await axios.get(API_URL, {
    params: {
      url
    },
    headers: {
      'X-API-Key': API_KEY,
      Accept: 'application/json'
    },
    timeout: 60000
  })

  const data = response.data?.response || response.data

  if (!data?.success || !data?.downloadUrl) {
    throw new Error('Hikari no devolvió un enlace válido')
  }

  return data
}

// ═══════════════════════════════════════
// ✰ OBTENER TÍTULO / DESCRIPCIÓN
// ═══════════════════════════════════════

async function obtenerDescripcion(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36'
      },
      timeout: 20000,
      maxRedirects: 5
    })

    const html = response.data || ''

    let titulo = ''

    const ogTitle =
      html.match(
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i
      )

    const ogDescription =
      html.match(
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i
      )

    if (ogTitle?.[1]) {
      titulo = ogTitle[1]
    } else if (ogDescription?.[1]) {
      titulo = ogDescription[1]
    }

    titulo = titulo
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()

    return titulo || 'TikTok'
  } catch {
    return 'TikTok'
  }
}

// ═══════════════════════════════════════
// ✰ DETECTAR TIPO DESDE LA URL
// ═══════════════════════════════════════

function detectarTipoPorUrl(url) {
  const texto = decodeURIComponent(url || '').toLowerCase()

  if (
    texto.includes('mime_type=audio') ||
    texto.includes('mime_type=audio_mpeg') ||
    texto.includes('audio_mpeg')
  ) {
    return 'audio'
  }

  if (
    texto.includes('mime_type=video') ||
    texto.includes('video_mp4')
  ) {
    return 'video'
  }

  if (
    texto.includes('mime_type=image') ||
    texto.includes('.jpg') ||
    texto.includes('.jpeg') ||
    texto.includes('.png') ||
    texto.includes('.webp')
  ) {
    return 'image'
  }

  return null
}

// ═══════════════════════════════════════
// ✰ DESCARGAR ARCHIVO
// ═══════════════════════════════════════

async function descargarArchivo(url, extension) {
  const nombre =
    `tiktok_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`

  const archivo = path.join(TMP_DIR, nombre)

  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 120000,
    maxRedirects: 10,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36',
      Referer: 'https://www.tiktok.com/'
    }
  })

  await pipeline(response.data, fs.createWriteStream(archivo))

  return {
    archivo,
    contentType: response.headers['content-type'] || ''
  }
}

// ═══════════════════════════════════════
// ✰ VALIDAR AUDIO
// ═══════════════════════════════════════

function comprobarAudio(archivo) {
  try {
    const stat = fs.statSync(archivo)

    return stat.size > 5000
  } catch {
    return false
  }
}

// ═══════════════════════════════════════
// ✰ VALIDAR VIDEO
// ═══════════════════════════════════════

function comprobarVideo(archivo) {
  try {
    const stat = fs.statSync(archivo)

    if (stat.size < 50000) {
      return false
    }

    const fd = fs.openSync(archivo, 'r')
    const buffer = Buffer.alloc(32)

    fs.readSync(fd, buffer, 0, 32, 0)
    fs.closeSync(fd)

    return buffer.includes(Buffer.from('ftyp'))
  } catch {
    return false
  }
}

// ═══════════════════════════════════════
// ✰ CONVERTIR AUDIO A MP3
// ═══════════════════════════════════════

async function convertirMP3(entrada) {
  const salida = path.join(
    TMP_DIR,
    `audio_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.mp3`
  )

  try {
    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-i',
        entrada,
        '-vn',
        '-acodec',
        'libmp3lame',
        '-b:a',
        '128k',
        salida
      ],
      {
        timeout: 120000
      }
    )

    if (
      fs.existsSync(salida) &&
      fs.statSync(salida).size > 5000
    ) {
      return salida
    }
  } catch {}

  return null
}

// ═══════════════════════════════════════
// ✰ PROCESAR TIKTOK
// ═══════════════════════════════════════

async function procesarTikTok(url) {
  const data = await obtenerTikTok(url)

  const downloadUrl = data.downloadUrl

  const tipoURL = detectarTipoPorUrl(downloadUrl)

  let titulo = 'TikTok'

  if (data.title) {
    titulo = data.title
  } else if (data.description) {
    titulo = data.description
  } else {
    titulo = await obtenerDescripcion(url)
  }

  // ═══════════════════════════════════
  // ✰ AUDIO
  // ═══════════════════════════════════

  if (tipoURL === 'audio') {
    const descarga = await descargarArchivo(
      downloadUrl,
      'mp3'
    )

    if (!comprobarAudio(descarga.archivo)) {
      fs.rmSync(descarga.archivo, {
        force: true
      })

      throw new Error('El audio descargado no es válido')
    }

    let audio = descarga.archivo

    // Si no es MP3 real, intentar convertirlo
    if (
      !descarga.contentType.includes('mpeg') &&
      !descarga.contentType.includes('mp3')
    ) {
      const convertido = await convertirMP3(
        descarga.archivo
      )

      if (convertido) {
        fs.rmSync(descarga.archivo, {
          force: true
        })

        audio = convertido
      }
    }

    return {
      tipo: 'audio',
      archivo: audio,
      titulo
    }
  }

  // ═══════════════════════════════════
  // ✰ VIDEO
  // ═══════════════════════════════════

  const descarga = await descargarArchivo(
    downloadUrl,
    'mp4'
  )

  if (!comprobarVideo(descarga.archivo)) {
    fs.rmSync(descarga.archivo, {
      force: true
    })

    throw new Error('El video descargado no es válido')
  }

  return {
    tipo: 'video',
    archivo: descarga.archivo,
    titulo
  }
}

// ═══════════════════════════════════════
// ✰ HANDLER
// ═══════════════════════════════════════

const handler = async (m, { conn, args }) => {
  const url = args?.[0]

  if (!url) {
    return m.reply(
      `*༺═────── ✰ ──────═༻*\n` +
      `*༻ 𝚃𝙸𝙺𝚃𝙾𝙺 ✰*\n\n` +
      `*༻ 𝚄𝚜𝚘:* .tiktok <url>\n` +
      `*༺═────── ✰ ──────═༻*`
    )
  }

  if (
    !/https?:\/\/(?:www\.)?(?:tiktok\.com|vt\.tiktok\.com)/i.test(
      url
    )
  ) {
    return m.reply(
      `*༺═────── ✰ ──────═༻*\n` +
      `*༻ 𝙴𝚁𝚁𝙾𝚁 𝚃𝙸𝙺𝚃𝙾𝙺 ✰*\n\n` +
      `*༻ 𝙴𝚗𝚕𝚊𝚌𝚎 𝚗𝚘 𝚟á𝚕𝚒𝚍𝚘.*\n` +
      `*༺═────── ✰ ──────═༻*`
    )
  }

  let resultado = null

  try {
    await conn.sendMessage(
      m.chat,
      {
        react: {
          text: '⏳',
          key: m.key
        }
      }
    )

    resultado = await procesarTikTok(url)

    const caption = `*${resultado.titulo}*`

    // ═══════════════════════════════════
    // ✰ SOLO AUDIO
    // ═══════════════════════════════════

    if (resultado.tipo === 'audio') {
      await conn.sendMessage(
        m.chat,
        {
          audio: {
            url: resultado.archivo
          },
          mimetype: 'audio/mpeg',
          fileName: `${resultado.titulo}.mp3`,
          ptt: false
        },
        {
          quoted: m
        }
      )
    }

    // ═══════════════════════════════════
    // ✰ VIDEO + AUDIO
    // ═══════════════════════════════════

    if (resultado.tipo === 'video') {
      await conn.sendMessage(
        m.chat,
        {
          video: {
            url: resultado.archivo
          },
          mimetype: 'video/mp4',
          fileName: `${resultado.titulo}.mp4`,
          caption
        },
        {
          quoted: m
        }
      )

      const audio = await convertirMP3(
        resultado.archivo
      )

      if (audio) {
        await conn.sendMessage(
          m.chat,
          {
            audio: {
              url: audio
            },
            mimetype: 'audio/mpeg',
            fileName: `${resultado.titulo}.mp3`,
            ptt: false
          },
          {
            quoted: m
          }
        )

        fs.rmSync(audio, {
          force: true
        })
      }
    }

    await conn.sendMessage(
      m.chat,
      {
        react: {
          text: '✅',
          key: m.key
        }
      }
    )

    if (resultado.archivo && fs.existsSync(resultado.archivo)) {
      fs.rmSync(resultado.archivo, {
        force: true
      })
    }
  } catch {
    if (
      resultado?.archivo &&
      fs.existsSync(resultado.archivo)
    ) {
      fs.rmSync(resultado.archivo, {
        force: true
      })
    }

    await conn.sendMessage(
      m.chat,
      {
        react: {
          text: '❌',
          key: m.key
        }
      }
    )

    await conn.sendMessage(
      m.chat,
      {
        text:
          `*༺═────── ✰ ──────═༻*\n` +
          `*༻ 𝙴𝚁𝚁𝙾𝚁 𝚃𝙸𝙺𝚃𝙾𝙺 ✰*\n\n` +
          `*༻ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚙𝚛𝚘𝚌𝚎𝚜𝚊𝚛 𝚎𝚕 𝚎𝚗𝚕𝚊𝚌𝚎.*\n` +
          `*༺═────── ✰ ──────═༻*`
      },
      {
        quoted: m
      }
    )
  }
}

handler.help = [
  'tiktok <url>',
  'tt <url>',
  'tiktokdl <url>'
]

handler.tags = ['descargas']

handler.command = [
  'tiktok',
  'tt',
  'tiktokdl'
]

export default handler
