import 'dotenv/config'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

// ═══════════════════════════════════════
// ✰ SAITAMABOT • INSTAGRAM DOWNLOADER
// ═══════════════════════════════════════

const API_KEY = process.env.HIKARI_API_KEY

const API_URL =
  'https://hikariapi.skyultraweb.com/api/scrapers/instagram'

const TMP_DIR = './tmp/saitamabot-instagram'

// ═══════════════════════════════════════
// ✰ CARPETA TEMPORAL
// ═══════════════════════════════════════

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true })
}

// ═══════════════════════════════════════
// ✰ DESCARGAR ARCHIVO
// ═══════════════════════════════════════

async function descargarArchivo(url, extension = 'bin') {
  const nombre =
    `instagram_${Date.now()}_${Math.random()
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
      Referer: 'https://www.instagram.com/'
    }
  })

  await pipeline(
    response.data,
    fs.createWriteStream(archivo)
  )

  return {
    archivo,
    contentType:
      response.headers['content-type'] || ''
  }
}

// ═══════════════════════════════════════
// ✰ OBTENER INSTAGRAM
// ═══════════════════════════════════════

async function obtenerInstagram(url) {
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

  const json = response.data

  const data =
    json?.response ||
    json

  if (!data?.success) {
    throw new Error(
      'Hikari no pudo procesar Instagram'
    )
  }

  const resultado = data?.data

  if (!resultado) {
    throw new Error(
      'Hikari no devolvió datos multimedia'
    )
  }

  return resultado
}

// ═══════════════════════════════════════
// ✰ OBTENER EXTENSIÓN
// ═══════════════════════════════════════

function obtenerExtension(item) {
  const url = item?.url || ''

  const limpio = url.split('?')[0].toLowerCase()

  if (
    item?.type === 'video' ||
    limpio.endsWith('.mp4')
  ) {
    return 'mp4'
  }

  if (
    item?.type === 'audio' ||
    limpio.endsWith('.mp3') ||
    limpio.endsWith('.m4a') ||
    limpio.endsWith('.aac')
  ) {
    return 'mp3'
  }

  if (
    limpio.endsWith('.png')
  ) {
    return 'png'
  }

  if (
    limpio.endsWith('.webp')
  ) {
    return 'webp'
  }

  return 'jpg'
}

// ═══════════════════════════════════════
// ✰ VALIDAR ARCHIVO
// ═══════════════════════════════════════

function archivoValido(archivo, tipo) {
  try {
    const stat = fs.statSync(archivo)

    if (tipo === 'video') {
      return stat.size > 50000
    }

    if (tipo === 'audio') {
      return stat.size > 5000
    }

    if (tipo === 'image') {
      return stat.size > 5000
    }

    return stat.size > 1000
  } catch {
    return false
  }
}

// ═══════════════════════════════════════
// ✰ CONVERTIR AUDIO A MP3
// ═══════════════════════════════════════

async function convertirAudioMP3(entrada) {
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
// ✰ NORMALIZAR DATOS
// ═══════════════════════════════════════

function normalizarItems(data) {
  if (
    Array.isArray(data?.items)
  ) {
    return data.items
      .filter(item => item?.url)
      .map(item => ({
        type: String(item.type || '').toLowerCase(),
        url: item.url,
        label: item.label || ''
      }))
  }

  // Compatibilidad con respuestas antiguas
  if (
    Array.isArray(data?.media)
  ) {
    return data.media
      .filter(url => typeof url === 'string')
      .map(url => ({
        type: 'image',
        url,
        label: 'image'
      }))
  }

  return []
}

// ═══════════════════════════════════════
// ✰ PROCESAR INSTAGRAM
// ═══════════════════════════════════════

async function procesarInstagram(url) {
  const data = await obtenerInstagram(url)

  const items = normalizarItems(data)

  if (!items.length) {
    throw new Error(
      'No se encontraron archivos multimedia'
    )
  }

  const descargados = []

  for (const item of items) {
    try {
      let tipo = item.type

      if (
        tipo !== 'image' &&
        tipo !== 'video' &&
        tipo !== 'audio'
      ) {
        tipo = 'image'
      }

      const extension =
        obtenerExtension({
          ...item,
          type: tipo
        })

      const descarga =
        await descargarArchivo(
          item.url,
          extension
        )

      if (
        !archivoValido(
          descarga.archivo,
          tipo
        )
      ) {
        fs.rmSync(
          descarga.archivo,
          { force: true }
        )

        continue
      }

      descargados.push({
        ...item,
        type: tipo,
        archivo: descarga.archivo,
        contentType:
          descarga.contentType
      })
    } catch {
      // Continúa con el siguiente archivo
    }
  }

  if (!descargados.length) {
    throw new Error(
      'No se pudo descargar ningún archivo'
    )
  }

  return {
    type: data?.type || 'post',
    items: descargados
  }
}

// ═══════════════════════════════════════
// ✰ LIMPIAR ARCHIVOS
// ═══════════════════════════════════════

function limpiarArchivos(items) {
  for (const item of items || []) {
    if (
      item?.archivo &&
      fs.existsSync(item.archivo)
    ) {
      fs.rmSync(
        item.archivo,
        { force: true }
      )
    }

    if (
      item?.audioConvertido &&
      fs.existsSync(item.audioConvertido)
    ) {
      fs.rmSync(
        item.audioConvertido,
        { force: true }
      )
    }
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
      `*༻ 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 ✰*\n\n` +
      `*༻ 𝚄𝚜𝚘:* .instagram <url>\n` +
      `*༺═────── ✰ ──────═༻*`
    )
  }

  if (
    !/https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\//i.test(
      url
    )
  ) {
    return m.reply(
      `*༺═────── ✰ ──────═༻*\n` +
      `*༻ 𝙴𝚁𝚁𝙾𝚁 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 ✰*\n\n` +
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

    resultado =
      await procesarInstagram(url)

    const items = resultado.items

    // ═══════════════════════════════════
    // ✰ SEPARAR MULTIMEDIA
    // ═══════════════════════════════════

    const imagenes =
      items.filter(
        item => item.type === 'image'
      )

    const videos =
      items.filter(
        item => item.type === 'video'
      )

    const audios =
      items.filter(
        item => item.type === 'audio'
      )

    // ═══════════════════════════════════
    // ✰ IMÁGENES / ÁLBUM
    // ═══════════════════════════════════

    for (const imagen of imagenes) {
      const label =
        imagen.label || 'image'

      await conn.sendMessage(
        m.chat,
        {
          image: {
            url: imagen.archivo
          },
          caption: `*${label}*`
        },
        {
          quoted: m
        }
      )
    }

    // ═══════════════════════════════════
    // ✰ VIDEOS
    // ═══════════════════════════════════

    for (const video of videos) {
      const label =
        video.label || 'video'

      await conn.sendMessage(
        m.chat,
        {
          video: {
            url: video.archivo
          },
          mimetype: 'video/mp4',
          fileName: `Instagram_${Date.now()}.mp4`,
          caption: `*${label}*`
        },
        {
          quoted: m
        }
      )
    }

    // ═══════════════════════════════════
    // ✰ AUDIOS
    // ═══════════════════════════════════

    for (const audio of audios) {
      const label =
        audio.label || 'audio'

      let archivoAudio =
        audio.archivo

      let convertido = null

      if (
        !audio.contentType.includes('mpeg') &&
        !audio.contentType.includes('mp3')
      ) {
        convertido =
          await convertirAudioMP3(
            audio.archivo
          )

        if (convertido) {
          archivoAudio = convertido

          audio.audioConvertido =
            convertido
        }
      }

      await conn.sendMessage(
        m.chat,
        {
          audio: {
            url: archivoAudio
          },
          mimetype: 'audio/mpeg',
          fileName: `Instagram_Audio_${Date.now()}.mp3`,
          ptt: false
        },
        {
          quoted: m
        }
      )
    }

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
    )

    limpiarArchivos(items)
  } catch {
    if (resultado?.items) {
      limpiarArchivos(resultado.items)
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
          `*༻ 𝙴𝚁𝚁𝙾𝚁 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 ✰*\n\n` +
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
  'instagram <url>',
  'ig <url>',
  'igdl <url>'
]

handler.tags = [
  'descargas'
]

handler.command = [
  'instagram',
  'ig',
  'igdl'
]

export default handler
