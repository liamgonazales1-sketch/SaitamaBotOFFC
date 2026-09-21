import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { rm } from 'fs/promises'
import config from '../../config.js'


// ═══════════════════════════════════════
// ✰ SAITAMABOT • YOUTUBE MP4 DOCUMENTO
// ═══════════════════════════════════════

const FAA_API =
  'https://api-faa.my.id/faa/ytplayvid'


const TMP_DIR =
  path.join(
    os.tmpdir(),
    'saitamabot-mp4doc'
  )


const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'


const API_TIMEOUT =
  60 * 1000


const DOWNLOAD_TIMEOUT =
  30 * 60 * 1000


// ═══════════════════════════════════════
// ✰ NOMBRE DEL BOT
// ═══════════════════════════════════════

const BOT_NAME =
  '𝑺𝒂𝒊𝒕𝒂𝒎𝒂𝑩𝒐𝒕'


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
// ✰ YOUTUBE ID
// ═══════════════════════════════════════

function getYouTubeId(
  url = ''
) {

  try {

    const u =
      new URL(url)


    if (
      u.hostname.includes(
        'youtube.com'
      )
    ) {

      const id =
        u.searchParams.get('v')


      if (id) {

        return id
      }


      const match =
        u.pathname.match(
          /\/(?:shorts|embed)\/([^/?]+)/
        )


      if (
        match?.[1]
      ) {

        return match[1]
      }
    }


    if (
      u.hostname ===
      'youtu.be'
    ) {

      return u.pathname
        .replace('/', '')
        .split('/')[0]
    }

  } catch {}


  return null
}


// ═══════════════════════════════════════
// ✰ MINIATURA
// ═══════════════════════════════════════

function getThumbnail(
  youtubeUrl = ''
) {

  const id =
    getYouTubeId(
      youtubeUrl
    )


  if (!id) {

    return null
  }


  return (
    `https://i.ytimg.com/vi/` +
    `${id}/hq720.jpg`
  )
}


// ═══════════════════════════════════════
// ✰ OBTENER MINIATURA
// ═══════════════════════════════════════

async function getThumbnailBuffer(
  url
) {

  if (!url) {

    return null
  }


  try {

    const controller =
      new AbortController()


    const timer =
      setTimeout(
        () =>
          controller.abort(),
        API_TIMEOUT
      )


    try {

      const response =
        await fetch(
          url,
          {

            method:
              'GET',

            headers: {

              'User-Agent':
                USER_AGENT,

              'Accept':
                'image/jpeg,image/*,*/*'

            },

            signal:
              controller.signal

          }
        )


      if (
        !response.ok
      ) {

        return null
      }


      const arrayBuffer =
        await response.arrayBuffer()


      const buffer =
        Buffer.from(
          arrayBuffer
        )


      if (
        !buffer.length
      ) {

        return null
      }


      return buffer

    } finally {

      clearTimeout(
        timer
      )
    }

  } catch {

    return null
  }
}


// ═══════════════════════════════════════
// ✰ NOMBRE SEGURO
// ═══════════════════════════════════════

function safeName(
  name
) {

  return String(
    name ||
    'youtube-video'
  )

    .replace(
      /[\\/:*?"<>|]/g,
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
    'youtube-video'
}


// ═══════════════════════════════════════
// ✰ FORMATO DE TAMAÑO
// ═══════════════════════════════════════

function formatSize(
  bytes
) {

  if (
    !Number.isFinite(bytes)
  ) {

    return 'Desconocido'
  }


  const mb =
    bytes /
    1024 /
    1024


  if (
    mb < 1024
  ) {

    return (
      `${mb.toFixed(2)} MB`
    )
  }


  return (
    `${(
      mb / 1024
    ).toFixed(2)} GB`
  )
}


// ═══════════════════════════════════════
// ✰ BUSCAR VIDEO
// ═══════════════════════════════════════

async function searchVideo(
  query
) {

  const apiUrl =
    `${FAA_API}?q=` +
    encodeURIComponent(
      query
    )


  const controller =
    new AbortController()


  const timer =
    setTimeout(
      () =>
        controller.abort(),
      API_TIMEOUT
    )


  try {

    const response =
      await fetch(
        apiUrl,
        {

          method:
            'GET',

          headers: {

            'User-Agent':
              USER_AGENT,

            'Accept':
              'application/json'

          },

          signal:
            controller.signal

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
        'No se encontró el vídeo.'
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
      !data.result.download_url
    ) {

      throw new Error(
        'La API no devolvió el enlace de descarga.'
      )
    }


    return data.result

  } finally {

    clearTimeout(
      timer
    )
  }
}


// ═══════════════════════════════════════
// ✰ DESCARGAR VIDEO
// ═══════════════════════════════════════

async function downloadVideo(
  url,
  output
) {

  const controller =
    new AbortController()


  const timer =
    setTimeout(
      () =>
        controller.abort(),
      DOWNLOAD_TIMEOUT
    )


  let file = null


  try {

    const response =
      await fetch(
        url,
        {

          method:
            'GET',

          headers: {

            'User-Agent':
              USER_AGENT,

            'Accept':
              'video/mp4,video/*,*/*'

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
        'El servidor no devolvió el vídeo.'
      )
    }


    await fs.promises.mkdir(
      path.dirname(output),
      {
        recursive: true
      }
    )


    file =
      fs.createWriteStream(
        output
      )


    await new Promise(
      (
        resolve,
        reject
      ) => {

        let finished =
          false


        const finish =
          () => {

            if (
              finished
            ) {

              return
            }


            finished =
              true


            resolve()
          }


        const fail =
          error => {

            if (
              finished
            ) {

              return
            }


            finished =
              true


            reject(
              error
            )
          }


        response.body.on(
          'error',
          fail
        )


        file.on(
          'error',
          fail
        )


        file.on(
          'finish',
          finish
        )


        response.body.pipe(
          file
        )
      }
    )


    const stat =
      await fs.promises.stat(
        output
      )


    if (
      !stat.isFile()
    ) {

      throw new Error(
        'El archivo no es válido.'
      )
    }


    if (
      stat.size < 10000
    ) {

      await rm(
        output,
        {
          force: true
        }
      ).catch(
        () => {}
      )


      throw new Error(
        'El vídeo está vacío o es inválido.'
      )
    }


    return stat

  } finally {

    clearTimeout(
      timer
    )


    if (
      file &&
      !file.closed
    ) {

      file.close()
    }
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

`༺ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝙼𝙿𝟺 𝙳𝙾𝙲 ༻

✰ 𝚄𝚜𝚊:
${usedPrefix}${command} <video>

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
${usedPrefix}${command} Shakira

✰ 𝙴𝚕 𝚟í𝚍𝚎𝚘 𝚜𝚎 𝚎𝚗𝚟𝚒𝚊𝚛á 𝚌𝚘𝚖𝚘 𝚍𝚘𝚌𝚞𝚖𝚎𝚗𝚝𝚘.

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

        text:
          '⏳',

        key:
          m.key

      }

    }
  ).catch(
    () => {}
  )


  const id =
    Date.now()


  const videoFile =
    path.join(
      TMP_DIR,
      `${id}.mp4`
    )


  try {

    await fs.promises.mkdir(
      TMP_DIR,
      {
        recursive: true
      }
    )


    // ═════════════════════════════════
    // ✰ BUSCAR
    // ═════════════════════════════════

    const result =
      await searchVideo(
        query
      )


    // ═════════════════════════════════
    // ✰ INFORMACIÓN
    // ═════════════════════════════════

    const title =
      textValue(
        result.searched_title,
        'YouTube Video'
      )


    const youtube =
      textValue(
        result.searched_url,
        'No disponible'
      )


    const format =
      textValue(
        result.format,
        'mp4'
      )


    // ═════════════════════════════════
    // ✰ MINIATURA
    // ═════════════════════════════════

    const thumbnail =
      getThumbnail(
        youtube
      )


    const thumbnailBuffer =
      await getThumbnailBuffer(
        thumbnail
      )


    // ═════════════════════════════════
    // ✰ MENSAJE INICIAL
    // ═════════════════════════════════

    const caption =
`༺ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝙼𝙿𝟺 𝙳𝙾𝙲 ༻

✰ 𝚃í𝚝𝚞𝚕𝚘: ${title}
✰ 𝙵𝚘𝚛𝚖𝚊𝚝𝚘: ${format.toUpperCase()}

✰ 𝙳𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚗𝚍𝚘...

✰ ${BOT_NAME}`


    // ═════════════════════════════════
    // ✰ ENVIAR MINIATURA
    // ═════════════════════════════════

    if (
      thumbnailBuffer
    ) {

      await conn.sendMessage(
        m.chat,
        {

          image:
            thumbnailBuffer,

          caption:
            caption

        },
        {

          quoted:
            m

        }
      )

    } else {

      await m.reply(
        caption
      )
    }


    // ═════════════════════════════════
    // ✰ DESCARGAR
    // ═════════════════════════════════

    const stat =
      await downloadVideo(
        result.download_url,
        videoFile
      )


    // ═════════════════════════════════
    // ✰ NOMBRE DEL ARCHIVO
    // ═════════════════════════════════

    const fileName =
      `${safeName(title)}.mp4`


    // ═════════════════════════════════
    // ✰ CAPTION DEL DOCUMENTO
    // ═════════════════════════════════

    const documentCaption =
`༺ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝙼𝙿𝟺 𝙳𝙾𝙲 ༻

✰ 𝙰𝚛𝚌𝚑𝚒𝚟𝚘: ${fileName}
✰ 𝚃𝚊𝚖𝚊ñ𝚘: ${formatSize(stat.size)}
✰ 𝙵𝚘𝚛𝚖𝚊𝚝𝚘: MP4

✰ ${BOT_NAME}`


    // ═════════════════════════════════
    // ✰ ENVIAR COMO DOCUMENTO
    // ═════════════════════════════════

    await conn.sendMessage(
      m.chat,
      {

        document: {
          url:
            videoFile
        },

        mimetype:
          'video/mp4',

        fileName:
          fileName,

        caption:
          documentCaption

      },
      {

        quoted:
          m

      }
    )


    // ═════════════════════════════════
    // ✰ REACCIÓN FINAL
    // ═════════════════════════════════

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
    ).catch(
      () => {}
    )


  } catch (error) {

    // ═════════════════════════════════
    // ✰ LIMPIAR
    // ═════════════════════════════════

    await rm(
      videoFile,
      {
        force:
          true
      }
    ).catch(
      () => {}
    )


    // ═════════════════════════════════
    // ✰ REACCIÓN ERROR
    // ═════════════════════════════════

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
    ).catch(
      () => {}
    )


    // ═════════════════════════════════
    // ✰ ERROR
    // ═════════════════════════════════

    return m.reply(

`༺ 𝙴𝚁𝚁𝙾𝚁 𝙼𝙿𝟺 𝙳𝙾𝙲 ༻

✰ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚛.

✰ ${
      String(
        error?.message ||
        error ||
        'Error desconocido.'
      ).slice(
        0,
        200
      )
    }

✰ ${BOT_NAME}`
    )


  } finally {

    // ═════════════════════════════════
    // ✰ ELIMINAR TEMPORAL
    // ═════════════════════════════════

    await rm(
      videoFile,
      {
        force:
          true
      }
    ).catch(
      () => {}
    )
  }
}


// ═══════════════════════════════════════
// ✰ CONFIGURACIÓN
// ═══════════════════════════════════════

handler.help = [

  'mp4doc <video>',
  'videodoc <video>'

]


handler.command = [

  'mp4doc',
    'videodoc',
  'docmp4'
]


handler.tags = [
  'descargas'
]


handler.register =
  false


export default handler
