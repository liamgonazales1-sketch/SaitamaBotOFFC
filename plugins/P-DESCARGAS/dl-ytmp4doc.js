import 'dotenv/config'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'

// ═══════════════════════════════════════
// ✰ SAITAMABOT • YOUTUBE MP4 DOCUMENTO
// ═══════════════════════════════════════

const API_HIKARI =
  'https://hikariapi.skyultraweb.com/api/scrapers/youtube/video'

const CLAVE_HIKARI =
  process.env.HIKARI_API_KEY

const CARPETA_TEMPORAL =
  path.resolve('./tmp/saitamabot-ytmp4doc')

const CALIDADES = [
  '1080p',
  '720p',
  '480p',
  '360p',
  '240p',
  '144p'
]

const esperar = ms =>
  new Promise(resolve =>
    setTimeout(resolve, ms)
  )

// ═══════════════════════════════════════
// ✰ CARPETA TEMPORAL
// ═══════════════════════════════════════

if (!fs.existsSync(CARPETA_TEMPORAL)) {
  fs.mkdirSync(CARPETA_TEMPORAL, {
    recursive: true
  })
}

// ═══════════════════════════════════════
// ✰ REACCIÓN
// ═══════════════════════════════════════

async function reaccionar(m, emoji) {
  try {
    await m.react(emoji)
  } catch {}
}

// ═══════════════════════════════════════
// ✰ OBTENER INFORMACIÓN
// ═══════════════════════════════════════

async function obtenerVideo(url, calidad) {

  if (!CLAVE_HIKARI) {
    throw new Error(
      'HIKARI_API_KEY no está configurada.'
    )
  }

  const respuesta = await axios.get(
    API_HIKARI,
    {
      params: {
        url,
        quality: calidad
      },

      headers: {
        'X-API-Key': CLAVE_HIKARI,
        'Accept': 'application/json'
      },

      timeout: 60000
    }
  )

  const json =
    respuesta.data

  const resultado =
    json?.response || json

  if (!resultado?.success) {
    throw new Error(
      resultado?.message ||
      'Hikari no pudo procesar el video.'
    )
  }

  return resultado
}

// ═══════════════════════════════════════
// ✰ DESCARGAR PROVIDER URL
// ═══════════════════════════════════════

async function descargarProveedor(
  url,
  archivo
) {

  const respuesta = await axios.get(
    url,
    {
      responseType: 'stream',

      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36',

        'Accept':
          'video/mp4,video/*,*/*'
      },

      maxRedirects: 10,

      timeout: 180000,

      validateStatus: estado =>
        estado >= 200 &&
        estado < 400
    }
  )

  const escritor =
    fs.createWriteStream(archivo)

  await pipeline(
    respuesta.data,
    escritor
  )
}

// ═══════════════════════════════════════
// ✰ DESCARGAR DESDE HIKARI
// ═══════════════════════════════════════

async function descargarHikari(
  url,
  archivo
) {

  const respuesta = await axios.get(
    url,
    {
      responseType: 'stream',

      headers: {
        'X-API-Key': CLAVE_HIKARI,

        'User-Agent':
          'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36',

        'Accept':
          'video/mp4,video/*,application/json,*/*'
      },

      maxRedirects: 10,

      timeout: 180000,

      validateStatus: estado =>
        estado >= 200 &&
        estado < 400
    }
  )

  const escritor =
    fs.createWriteStream(archivo)

  await pipeline(
    respuesta.data,
    escritor
  )
}

// ═══════════════════════════════════════
// ✰ COMPROBAR MP4
// ═══════════════════════════════════════

function comprobarMP4(archivo) {

  if (!fs.existsSync(archivo)) {
    return false
  }

  const informacion =
    fs.statSync(archivo)

  if (informacion.size < 100000) {
    return false
  }

  const descriptor =
    fs.openSync(archivo, 'r')

  const buffer =
    Buffer.alloc(32)

  fs.readSync(
    descriptor,
    buffer,
    0,
    32,
    0
  )

  fs.closeSync(descriptor)

  const firma =
    buffer.toString(
      'ascii',
      4,
      8
    )

  return firma === 'ftyp'
}

// ═══════════════════════════════════════
// ✰ LIMPIAR TÍTULO
// ═══════════════════════════════════════

function limpiarTitulo(titulo) {

  return String(
    titulo || 'Video de YouTube'
  )

    .replace(
      /\s*\(\s*\d{3,4}p[^)]*\)\s*/gi,
      ''
    )

    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      ''
    )

    .trim()
}

// ═══════════════════════════════════════
// ✰ PROCESAR VIDEO
// ═══════════════════════════════════════

async function procesarVideo(
  urlYoutube,
  calidad
) {

  const resultado =
    await obtenerVideo(
      urlYoutube,
      calidad
    )

  const datos =
    resultado?.data

  if (!datos) {
    throw new Error(
      'Hikari no devolvió los datos del video.'
    )
  }

  const titulo =
    limpiarTitulo(
      datos.filename
    )

  const nombreArchivo =
    `${Date.now()}-${titulo}.mp4`

  const archivo =
    path.join(
      CARPETA_TEMPORAL,
      nombreArchivo
    )

  // ═══════════════════════════════════
  // ✰ PRIMERA OPCIÓN: PROVIDER URL
  // ═══════════════════════════════════

  if (datos.providerUrl) {

    try {

      await descargarProveedor(
        datos.providerUrl,
        archivo
      )

      if (
        comprobarMP4(archivo)
      ) {

        return {
          archivo,
          titulo
        }
      }

      if (fs.existsSync(archivo)) {
        fs.unlinkSync(archivo)
      }

    } catch {

      if (fs.existsSync(archivo)) {
        fs.unlinkSync(archivo)
      }
    }
  }

  // ═══════════════════════════════════
  // ✰ SEGUNDA OPCIÓN: DOWNLOAD URL
  // ═══════════════════════════════════

  if (!datos.downloadUrl) {
    throw new Error(
      'Hikari no proporcionó una URL de descarga.'
    )
  }

  // Hikari puede necesitar varios intentos
  for (
    let intento = 1;
    intento <= 8;
    intento++
  ) {

    try {

      await descargarHikari(
        datos.downloadUrl,
        archivo
      )

      // MP4 listo
      if (
        comprobarMP4(archivo)
      ) {

        return {
          archivo,
          titulo
        }
      }

      // ═══════════════════════════════
      // ✰ HIKARI TODAVÍA PREPARANDO
      // ═══════════════════════════════

      if (
        fs.existsSync(archivo)
      ) {

        const tamaño =
          fs.statSync(archivo).size

        if (tamaño < 50000) {

          const contenido =
            fs.readFileSync(
              archivo,
              'utf8'
            )

          let json = null

          try {
            json =
              JSON.parse(contenido)
          } catch {}

          if (
            json?.status === 'preparing'
          ) {

            const segundos =
              Number(
                json.retryAfterSeconds
              ) || 2

            fs.unlinkSync(
              archivo
            )

            await esperar(
              segundos * 1000
            )

            continue
          }
        }

        fs.unlinkSync(
          archivo
        )
      }

    } catch {

      if (fs.existsSync(archivo)) {
        fs.unlinkSync(archivo)
      }

      await esperar(2000)
    }
  }

  throw new Error(
    'Hikari no terminó de preparar el MP4.'
  )
}

// ═══════════════════════════════════════
// ✰ HANDLER
// ═══════════════════════════════════════

const handler = async (
  m,
  {
    conn,
    text
  }
) => {

  if (!text) {
    return
  }

  const urlYoutube =
    text.trim()

  // ═══════════════════════════════════
  // ✰ VALIDAR YOUTUBE
  // ═══════════════════════════════════

  if (
    !urlYoutube.includes(
      'youtube.com'
    ) &&
    !urlYoutube.includes(
      'youtu.be'
    )
  ) {

    await reaccionar(
      m,
      '❌'
    )

    return
  }

  // SOLO REACCIÓN
  await reaccionar(
    m,
    '⏳'
  )

  let resultado = null
  let ultimoError = null

  try {

    // ═══════════════════════════════════
    // ✰ PROBAR CALIDADES
    // ═══════════════════════════════════

    for (
      const calidad of CALIDADES
    ) {

      try {

        resultado =
          await procesarVideo(
            urlYoutube,
            calidad
          )

        break

      } catch (error) {

        ultimoError =
          error
      }
    }

    if (!resultado) {
      throw (
        ultimoError ||
        new Error(
          'No se pudo descargar el video.'
        )
      )
    }

    const {
      archivo,
      titulo
    } = resultado

    // ═══════════════════════════════════
    // ✰ ENVIAR DOCUMENTO
    // ═══════════════════════════════════

    await conn.sendMessage(
      m.chat,
      {
        document: {
          url: archivo
        },

        mimetype:
          'video/mp4',

        fileName:
          `${titulo}.mp4`,

        caption:
          `*${titulo}*`
      },
      {
        quoted: m
      }
    )

    // REACCIÓN FINAL
    await reaccionar(
      m,
      '✅'
    )

    // ═══════════════════════════════════
    // ✰ BORRAR TEMPORAL
    // ═══════════════════════════════════

    try {
      fs.unlinkSync(
        archivo
      )
    } catch {}

  } catch (error) {

    console.error(
      '[YTMP4DOC]',
      error.message
    )

    await reaccionar(
      m,
      '❌'
    )

    return m.reply(
      `*༺═────── ✰ ──────═༻*

*༻ 𝙴𝚁𝚁𝙾𝚁 𝚈𝚃𝙼𝙿𝟺 𝙳𝙾𝙲 ✰*

*✰ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚘𝚋𝚝𝚎𝚗𝚎𝚛 𝚎𝚕 𝙼𝙿𝟺.*

*༺═────── ✰ ──────═༻*`
    )
  }
}

// ═══════════════════════════════════════
// ✰ COMANDOS
// ═══════════════════════════════════════

handler.help = [
  'ytmp4doc'
]

handler.tags = [
  'descargas'
]

handler.command = [
  'ytmp4doc',
  'ytvdoc',
  'mp4ytdoc'
]

export default handler
