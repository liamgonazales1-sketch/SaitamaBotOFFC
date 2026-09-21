import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { rm } from 'fs/promises'
import { writeAudioTags } from '../../lib/audioTags.js'


// ═══════════════════════════════════════
// ✰ SAITAMABOT • YOUTUBE MP3 DOCUMENTO
// ═══════════════════════════════════════

const FAA_API =
  'https://api-faa.my.id/faa/ytplay'


const TMP_DIR =
  path.join(
    os.tmpdir(),
    'saitamabot-mp3-doc'
  )


const BOT_NAME =
  '𝑺𝒂𝒊𝒕𝒂𝒎𝒂𝑩𝒐𝒕'


const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'


const API_TIMEOUT =
  60 * 1000


const DOWNLOAD_TIMEOUT =
  10 * 60 * 1000


// ═══════════════════════════════════════
// ✰ CREAR CARPETA
// ═══════════════════════════════════════

await fs.promises.mkdir(
  TMP_DIR,
  {
    recursive: true
  }
)


// ═══════════════════════════════════════
// ✰ VALOR → TEXTO
// ═══════════════════════════════════════

function textValue(
  value,
  fallback = 'Desconocido'
) {

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {

    return fallback
  }


  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {

    return String(value)
  }


  if (
    typeof value === 'object'
  ) {

    const possible =
      value.name ||
      value.title ||
      value.text ||
      value.label ||
      value.value ||
      value.username ||
      value.channelName ||
      value.formatted ||
      value.display


    if (possible) {

      return textValue(
        possible,
        fallback
      )
    }
  }


  return fallback
}


// ═══════════════════════════════════════
// ✰ NOMBRE SEGURO
// ═══════════════════════════════════════

function safeFileName(
  title = 'audio-youtube'
) {

  return String(title)
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
    'audio-youtube'
}


// ═══════════════════════════════════════
// ✰ VISTAS
// ═══════════════════════════════════════

function formatViews(
  views
) {

  if (
    views === undefined ||
    views === null ||
    views === ''
  ) {

    return 'Desconocidas'
  }


  const number =
    Number(
      String(views)
        .replace(
          /[^\d]/g,
          ''
        )
    )


  if (
    !Number.isFinite(number)
  ) {

    return String(views)
  }


  return number.toLocaleString(
    'es-ES'
  )
}


// ═══════════════════════════════════════
// ✰ DURACIÓN
// ═══════════════════════════════════════

function formatDuration(
  duration,
  timestamp
) {

  if (timestamp) {

    return String(
      timestamp
    )
  }


  if (
    duration === undefined ||
    duration === null
  ) {

    return 'Desconocida'
  }


  const seconds =
    Number(duration)


  if (
    !Number.isFinite(seconds)
  ) {

    return String(duration)
  }


  const hours =
    Math.floor(
      seconds / 3600
    )


  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    )


  const secs =
    Math.floor(
      seconds % 60
    )


  if (hours > 0) {

    return (
      `${hours}:` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(secs).padStart(2, '0')}`
    )
  }


  return (
    `${minutes}:` +
    `${String(secs).padStart(2, '0')}`
  )
}


// ═══════════════════════════════════════
// ✰ BUSCAR YOUTUBE
// ═══════════════════════════════════════

async function searchYouTube(
  query
) {

  const apiUrl =
    `${FAA_API}?query=` +
    encodeURIComponent(query)


  const response =
    await fetch(
      apiUrl,
      {
        method: 'GET',

        headers: {
          'User-Agent':
            USER_AGENT,

          'Accept':
            'application/json'
        },

        timeout:
          API_TIMEOUT
      }
    )


  const body =
    await response.text()


  let data


  try {

    data =
      JSON.parse(body)

  } catch {

    throw new Error(
      'La API no devolvió JSON válido.'
    )
  }


  if (
    !response.ok
  ) {

    throw new Error(
      data?.message ||
      data?.error ||
      `FAA HTTP ${response.status}`
    )
  }


  if (
    !data?.status
  ) {

    throw new Error(
      data?.message ||
      data?.error ||
      'No se encontraron resultados.'
    )
  }


  if (
    !data?.result
  ) {

    throw new Error(
      'La API no devolvió información.'
    )
  }


  if (
    !data.result.mp3
  ) {

    throw new Error(
      'La API no devolvió el MP3.'
    )
  }


  return data.result
}


// ═══════════════════════════════════════
// ✰ DESCARGAR MP3
// ═══════════════════════════════════════

async function downloadMp3(
  url,
  output
) {

  const controller =
    new AbortController()


  const timer =
    setTimeout(
      () => controller.abort(),
      DOWNLOAD_TIMEOUT
    )


  try {

    const response =
      await fetch(
        url,
        {
          method: 'GET',

          headers: {
            'User-Agent':
              USER_AGENT,

            'Accept':
              'audio/mpeg,audio/*,*/*'
          },

          redirect:
            'follow',

          signal:
            controller.signal
        }
      )


    if (
      !response.ok
    ) {

      throw new Error(
        `Descarga HTTP ${response.status}`
      )
    }


    if (
      !response.body
    ) {

      throw new Error(
        'El servidor no devolvió el audio.'
      )
    }


    await fs.promises.mkdir(
      path.dirname(output),
      {
        recursive: true
      }
    )


    const file =
      fs.createWriteStream(
        output
      )


    await new Promise(
      (resolve, reject) => {

        response.body.pipe(file)


        response.body.once(
          'error',
          reject
        )


        file.once(
          'error',
          reject
        )


        file.once(
          'finish',
          resolve
        )
      }
    )


    const stat =
      await fs.promises.stat(
        output
      )


    if (
      !stat.isFile() ||
      stat.size < 1000
    ) {

      await rm(
        output,
        {
          force: true
        }
      ).catch(() => {})


      throw new Error(
        'El MP3 descargado no es válido.'
      )
    }


    return stat

  } finally {

    clearTimeout(timer)
  }
}


// ═══════════════════════════════════════
// ✰ MINIATURA
// ═══════════════════════════════════════

async function getThumbnail(
  url
) {

  if (!url) {
    return null
  }


  try {

    const response =
      await fetch(
        url,
        {
          headers: {
            'User-Agent':
              USER_AGENT
          },

          timeout:
            API_TIMEOUT
        }
      )


    if (
      !response.ok
    ) {

      return null
    }


    const buffer =
      Buffer.from(
        await response.arrayBuffer()
      )


    if (
      !buffer.length
    ) {

      return null
    }


    return buffer

  } catch {

    return null
  }
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

  const query =
    String(
      text || ''
    ).trim()


  // ═══════════════════════════════════
  // ✰ SIN CONSULTA
  // ═══════════════════════════════════

  if (!query) {

    return m.reply(

`༺ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝙼𝙿𝟹 𝙳𝙾𝙲 ༻

✰ 𝚄𝚜𝚊:
${usedPrefix}${command} <canción>

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
${usedPrefix}${command} Ozuna Mi Niña

✰ ${BOT_NAME}`
    )
  }


  // ═══════════════════════════════════
  // ✰ REACCIÓN
  // ═══════════════════════════════════

  await conn.sendMessage(
    m.chat,
    {
      react: {
        text: '⏳',
        key: m.key
      }
    }
  ).catch(() => {})


  const audioFile =
    path.join(
      TMP_DIR,
      `${Date.now()}.mp3`
    )


  let progressMsg = null


  try {

    // ═════════════════════════════════
    // ✰ BUSCAR
    // ═════════════════════════════════

    const result =
      await searchYouTube(
        query
      )


    const title =
      textValue(
        result.title,
        'Audio de YouTube'
      )


    const author =
      textValue(
        result.author,
        'Desconocido'
      )


    const views =
      formatViews(
        result.views
      )


    const duration =
      formatDuration(
        result.duration,
        result.duration_timestamp
      )


    const thumbnail =
      textValue(
        result.thumbnail,
        ''
      )


    // ═════════════════════════════════
    // ✰ MINIATURA
    // ═════════════════════════════════

    const thumbnailBuffer =
      await getThumbnail(
        thumbnail
      )


    // ═════════════════════════════════
    // ✰ MENSAJE INICIAL
    // ═════════════════════════════════

    const caption =

`༺ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝙼𝙿𝟹 𝙳𝙾𝙲 ༻

✰ 𝚃í𝚝𝚞𝚕𝚘: ${title}
✰ 𝙰𝚞𝚝𝚘𝚛: ${author}
✰ 𝚅𝚒𝚜𝚝𝚊𝚜: ${views}
✰ 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗: ${duration}

✰ 𝙳𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚗𝚍𝚘...

✰ ${BOT_NAME}`


    if (
      thumbnailBuffer
    ) {

      await conn.sendMessage(
        m.chat,
        {
          image:
            thumbnailBuffer,

          caption
        },
        {
          quoted:
            m
        }
      )

    } else {

      progressMsg =
        await m.reply(
          caption
        )
    }


    // ═════════════════════════════════
    // ✰ DESCARGAR
    // ═════════════════════════════════

    await downloadMp3(
      result.mp3,
      audioFile
    )


    // ═════════════════════════════════
    // ✰ TAGS DEL MP3
    // ═════════════════════════════════

    try {

      await writeAudioTags(
        audioFile,
        {
          title,

          author,

          image:
            thumbnail
        }
      )

    } catch {}


    // ═════════════════════════════════
    // ✰ LEER AUDIO
    // ═════════════════════════════════

    const audio =
      await fs.promises.readFile(
        audioFile
      )


    if (
      !audio.length
    ) {

      throw new Error(
        'El MP3 está vacío.'
      )
    }


    // ═════════════════════════════════
    // ✰ NOMBRE DEL DOCUMENTO
    // ═════════════════════════════════

    const fileName =
      `${safeFileName(title)}.mp3`


    // ═════════════════════════════════
    // ✰ ENVIAR MP3 COMO DOCUMENTO
    // ═════════════════════════════════

    await conn.sendMessage(
      m.chat,
      {
        document:
          audio,

        mimetype:
          'audio/mpeg',

        fileName:
          fileName
      },
      {
        quoted:
          m
      }
    )


    // ═════════════════════════════════
    // ✰ LIMPIAR
    // ═════════════════════════════════

    await rm(
      audioFile,
      {
        force: true
      }
    ).catch(() => {})


    // ═════════════════════════════════
    // ✰ REACCIÓN FINAL
    // ═════════════════════════════════

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

    // ═════════════════════════════════
    // ✰ LIMPIAR SI HAY ERROR
    // ═════════════════════════════════

    await rm(
      audioFile,
      {
        force: true
      }
    ).catch(() => {})


    // ═════════════════════════════════
    // ✰ REACCIÓN ERROR
    // ═════════════════════════════════

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

`༺ 𝙴𝚁𝚁𝙾𝚁 𝙼𝙿𝟹 𝙳𝙾𝙲 ༻

✰ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚛.

✰ ${String(
  error?.message ||
  'Error desconocido.'
).slice(0, 150)}

✰ ${BOT_NAME}`
    )
  }
}


// ═══════════════════════════════════════
// ✰ CONFIGURACIÓN
// ═══════════════════════════════════════

handler.help = [
  'playaudiodoc <canción>',
  'audioplaydoc <canción>'
]


// ═══════════════════════════════════════
// ✰ CATEGORÍA
// ═══════════════════════════════════════

handler.tags = [
  'descargas'
]


// ═══════════════════════════════════════
// ✰ COMANDOS
// ═══════════════════════════════════════

handler.command = [
  'playaudiodoc',
    'audioplaydoc',
  'mp3doc',
  'audiomp3doc',
  'docmp3',
  'musicadoc'
]


// ═══════════════════════════════════════
// ✰ REGISTRO
// ═══════════════════════════════════════

handler.register = false


// ═══════════════════════════════════════
// ✰ EXPORTAR
// ═══════════════════════════════════════

export default handler
