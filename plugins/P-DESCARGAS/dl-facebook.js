import fetch from 'node-fetch'
import config from '../../config.js'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ༺ 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 • 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁 ༻
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AZBRY_API =
  'https://api.azbry.com/api/download/facebook'

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'

const API_TIMEOUT =
  60_000

const VIDEO_TIMEOUT =
  180_000


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OBTENER URL DE FACEBOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getFacebookUrl(m, text = '') {

  let url =
    String(text || '').trim()

  if (!url && m.quoted) {

    const quotedText =
      m.quoted.body ||
      m.quoted.text ||
      ''

    const match =
      quotedText.match(
        /https?:\/\/(?:www\.)?(?:facebook\.com|fb\.watch|fb\.me|video\.fb\.com)\/[^\s]+/i
      )

    if (match) {
      url = match[0]
    }
  }

  return url.replace(
    /[)\]}>,]+$/g,
    ''
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VALIDAR URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isFacebookUrl(url) {

  return /^https?:\/\/(?:www\.)?(?:facebook\.com|fb\.watch|fb\.me|video\.fb\.com)\//i
    .test(url)
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AZBRY FACEBOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function azbryFacebook(url) {

  const apiUrl =
    `${AZBRY_API}?url=${encodeURIComponent(url)}`

  const response =
    await fetch(
      apiUrl,
      {
        method: 'GET',

        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json'
        },

        timeout: API_TIMEOUT
      }
    )

  const responseText =
    await response.text()

  if (!response.ok) {

    throw new Error(
      `Azbry HTTP ${response.status}`
    )
  }

  let data

  try {

    data =
      JSON.parse(responseText)

  } catch {

    throw new Error(
      'Azbry no respondió JSON válido.'
    )
  }

  if (!data?.status) {

    throw new Error(
      'Azbry no pudo obtener el vídeo.'
    )
  }

  if (
    !Array.isArray(data?.result?.medias) ||
    !data.result.medias.length
  ) {

    throw new Error(
      'Azbry no devolvió vídeos disponibles.'
    )
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BUSCAR HD PRIMERO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const medias =
    data.result.medias

  const hd =
    medias.find(
      media =>
        String(media?.quality || '').toLowerCase() === 'hd' &&
        media?.videoAvailable === true &&
        media?.audioAvailable === true &&
        media?.url
    )


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SI NO HAY HD, USAR CUALQUIER CALIDAD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const media =
    hd ||
    medias.find(
      item =>
        item?.url &&
        item?.videoAvailable !== false
    )


  if (!media?.url) {

    throw new Error(
      'No se encontró una URL de vídeo válida.'
    )
  }


  return {

    ...data,

    videoUrl:
      media.url,

    quality:
      media.quality ||
      '—',

    size:
      media.formattedSize ||
      '—',

    title:
      data.result?.title ||
      'Facebook Video',

    thumbnail:
      data.result?.thumbnail ||
      '',

    duration:
      data.result?.duration ||
      '—'
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESCARGAR VÍDEO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function downloadVideo(videoUrl) {

  const response =
    await fetch(
      videoUrl,
      {
        method: 'GET',

        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'video/mp4,video/*,*/*',
          'Referer': 'https://www.facebook.com/'
        },

        redirect: 'follow',

        timeout: VIDEO_TIMEOUT
      }
    )

  if (!response.ok) {

    throw new Error(
      `Facebook CDN HTTP ${response.status}`
    )
  }

  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    )

  if (!buffer.length) {

    throw new Error(
      'El vídeo está vacío.'
    )
  }

  if (buffer.length < 10 * 1024) {

    throw new Error(
      'El archivo recibido no parece ser un vídeo válido.'
    )
  }

  return buffer
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOMBRE DEL ARCHIVO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function safeFileName(title) {

  return String(
    title ||
    'facebook-video'
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
      80
    )

    || 'facebook-video'
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CAPTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createCaption(data) {

  const title =
    data.title ||
    'Facebook Video'

  const duration =
    data.duration ||
    '—'

  const quality =
    data.quality ||
    '—'

  const size =
    data.size ||
    '—'

  return `*༺═────── ✰ ──────═༻*
*༻ 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 ✰*

*༻ 𝚃í𝚝𝚞𝚕𝚘:* *${title}*
*༻ 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* *${duration}*
*༻ 𝚀𝚞𝚊𝚕𝚒𝚝𝚢:* *${quality}*
*༻ 𝚃𝚊𝚖𝚊ñ𝚘:* *${size}*

*༺═────── ✰ ──────═༻*`
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let handler = async (
  m,
  {
    conn,
    text
  }
) => {

  const url =
    getFacebookUrl(
      m,
      text
    )


  if (!url) {

    return m.reply(
      `*༺═────── ✰ ──────═༻*

*༻ 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 ✰*

✰ Envía un enlace de Facebook.

*Ejemplo:*
.fb https://www.facebook.com/...

*༺═────── ✰ ──────═༻*`
    )
  }


  if (!isFacebookUrl(url)) {

    return m.reply(
      `*༺═────── ✰ ──────═༻*

*༻ 𝙻𝚒𝚗𝚔 𝚒𝚗𝚟á𝚕𝚒𝚍𝚘 ✰*

✰ El enlace no parece ser de Facebook.

*༺═────── ✰ ──────═༻*`
    )
  }


  // REACCIÓN PROCESANDO

  await conn.sendMessage(
    m.chat,
    {
      react: {
        text: '⏳',
        key: m.key
      }
    }
  )


  await m.reply(
    `*༺═────── ✰ ──────═༻*

*༻ 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 ✰*

✰ Analizando enlace...
✰ Obteniendo vídeo en HD...

*༺═────── ✰ ──────═༻*`
  )


  try {

    // Obtener vídeo desde Azbry

    const data =
      await azbryFacebook(
        url
      )


    // URL directa

    const videoUrl =
      data.videoUrl


    // Descargar vídeo

    const videoBuffer =
      await downloadVideo(
        videoUrl
      )


    // Crear caption

    const caption =
      createCaption(
        data
      )


    // Nombre

    const title =
      data.title ||
      'Facebook Video'


    // Enviar vídeo

    await conn.sendMessage(
      m.chat,
      {
        video: videoBuffer,

        mimetype:
          'video/mp4',

        fileName:
          `${safeFileName(title)}.mp4`,

        caption
      },
      {
        quoted: m
      }
    )


    // REACCIÓN ÉXITO

    await conn.sendMessage(
      m.chat,
      {
        react: {
          text: '✰',
          key: m.key
        }
      }
    )

  } catch (error) {

    console.error(
      '[FACEBOOK DL]',
      error
    )


    // REACCIÓN ERROR

    await conn.sendMessage(
      m.chat,
      {
        react: {
          text: '❌',
          key: m.key
        }
      }
    )


    await m.reply(
      `*༺═────── ✰ ──────═༻*

*༻ 𝙴𝚁𝚁𝙾𝚁 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 ✰*

✰ No se pudo descargar el vídeo.

✰ ${error?.message || 'Error desconocido.'}

*༺═────── ✰ ──────═༻*`
    )
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

handler.help = [
  'fb <link>',
  'facebook <link>'
]

handler.tags = [
  'descargas'
]

handler.command = [
  'fb',
  'fbdl',
  'facebook',
  'facebookdl'
]

export default handler
