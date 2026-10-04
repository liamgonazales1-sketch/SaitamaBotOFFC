import axios from 'axios'
import config from '../../config.js'

// ═══════════════════════════════════════
// ✰ SAITAMABOT • INSTAGRAM DOWNLOADER
// ✰ API: HIKARIAPI
// ═══════════════════════════════════════

const API_URL =
  'https://hikariapi.skyultraweb.com/api/scrapers/instagram'

const API_KEY =
  'hk_live_abQitrvggZrwvQ4yN_8rwx8pj_Dy7NmDtrgMpqewG4c'

const API_TIMEOUT =
  60000


// ═══════════════════════════════════════
// ✰ OBTENER URL
// ═══════════════════════════════════════

function getInstagramUrl(m, text = '') {

  let url =
    String(text || '').trim()


  // Obtener URL desde mensaje citado
  if (!url && m.quoted) {

    const quotedText =
      m.quoted.body ||
      m.quoted.text ||
      ''

    const match =
      quotedText.match(
        /https?:\/\/[^\s]+/i
      )

    if (match) {
      url = match[0]
    }
  }


  // Limpiar caracteres finales
  url =
    url.replace(
      /[)\]}>,]+$/g,
      ''
    )


  return url
}


// ═══════════════════════════════════════
// ✰ VALIDAR INSTAGRAM
// ═══════════════════════════════════════

function isInstagramUrl(url) {

  return /^https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\//i
    .test(url)

}


// ═══════════════════════════════════════
// ✰ TEXTO SEGURO
// ═══════════════════════════════════════

function safeText(value, fallback = '') {

  const text =
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim()

  return text || fallback
}


// ═══════════════════════════════════════
// ✰ CAPTION
// ═══════════════════════════════════════

function createCaption(
  title,
  type = 'INSTAGRAM'
) {

  return (
`༺ 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 ༻

✰ 𝚃𝚒𝚙𝚘: ${type}
✰ 𝙸𝚗𝚏𝚘: ${title}

✰ ${config.botName || 'SaitamaBot'}`
  )

}


// ═══════════════════════════════════════
// ✰ ENVIAR VIDEO
// ═══════════════════════════════════════

async function sendVideo(
  conn,
  m,
  media
) {

  return conn.sendMessage(
    m.chat,
    {

      video: {
        url: media.url
      },

      mimetype:
        'video/mp4',

      caption:
        createCaption(
          media.label || 'Video de Instagram',
          '𝚅𝚒𝚍𝚎𝚘'
        )

    },
    {
      quoted: m
    }
  )
}


// ═══════════════════════════════════════
// ✰ ENVIAR AUDIO
// ═══════════════════════════════════════

async function sendAudio(
  conn,
  m,
  media
) {

  return conn.sendMessage(
    m.chat,
    {

      audio: {
        url: media.url
      },

      mimetype:
        'audio/mpeg',

      ptt:
        false,

      fileName:
        'SaitamaBot-Instagram.mp3'

    },
    {
      quoted: m
    }
  )
}


// ═══════════════════════════════════════
// ✰ HANDLER PRINCIPAL
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

  const url =
    getInstagramUrl(
      m,
      text
    )


  // ═════════════════════════════════════
  // ✰ SIN URL
  // ═════════════════════════════════════

  if (!url) {

    return m.reply(

`༺ 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 ༻

✰ 𝙴𝚗𝚕𝚊𝚌𝚎 𝚛𝚎𝚚𝚞𝚎𝚛𝚒𝚍𝚘

✰ 𝙴𝚗𝚟í𝚊 𝚞𝚗 𝚎𝚗𝚕𝚊𝚌𝚎 𝚍𝚎 𝙸𝚗𝚜𝚝𝚊𝚐𝚛𝚊𝚖.

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
${usedPrefix}${command} https://instagram.com/reel/xxxx

✰ ${config.botName || 'SaitamaBot'}`
    )
  }


  // ═════════════════════════════════════
  // ✰ URL INVÁLIDA
  // ═════════════════════════════════════

  if (!isInstagramUrl(url)) {

    return m.reply(

`༺ 𝙴𝚗𝚕𝚊𝚌𝚎 𝚒𝚗𝚟á𝚕𝚒𝚍𝚘 ༻

✰ 𝙴𝚕 𝚎𝚗𝚕𝚊𝚌𝚎 𝚗𝚘 𝚙𝚎𝚛𝚝𝚎𝚗𝚎𝚌𝚎 𝚊 𝙸𝚗𝚜𝚝𝚊𝚐𝚛𝚊𝚖.

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
${usedPrefix}${command} https://instagram.com/reel/xxxx

✰ ${config.botName || 'SaitamaBot'}`
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
  // ✰ PROCESANDO
  // ═════════════════════════════════════

  await m.reply(

`༺ 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 ༻

✰ 𝙰𝚗𝚊𝚕𝚒𝚣𝚊𝚗𝚍𝚘 𝚎𝚗𝚕𝚊𝚌𝚎...
✰ 𝙲𝚘𝚗𝚜𝚞𝚕𝚝𝚊𝚗𝚍𝚘 𝙷𝚒𝚔𝚊𝚛𝚒𝙰𝙿𝙸...
✰ 𝙾𝚋𝚝𝚎𝚗𝚒𝚎𝚗𝚍𝚘 𝚌𝚘𝚗𝚝𝚎𝚗𝚒𝚍𝚘...

✰ ${config.botName || 'SaitamaBot'}`
  )


  try {

    // ═══════════════════════════════════
    // ✰ CONSULTAR HIKARI API
    // ═══════════════════════════════════

    const response =
      await axios.get(
        API_URL,
        {
          params: {

            url:
              url,

            apikey:
              API_KEY

          },

          timeout:
            API_TIMEOUT,

          headers: {

            'User-Agent':
              'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',

            Accept:
              'application/json'

          }
        }
      )


    const json =
      response.data


    // ═══════════════════════════════════
    // ✰ VALIDAR RESPUESTA PRINCIPAL
    // ═══════════════════════════════════

    if (
      !json ||
      json.ok !== true ||
      json.httpStatus !== 200 ||
      !json.response ||
      json.response.success !== true
    ) {

      throw new Error(
        'La API no pudo procesar el enlace.'
      )
    }


    // ═══════════════════════════════════
    // ✰ OBTENER DATA
    // ═══════════════════════════════════

    const data =
      json.response.data


    if (
      !data ||
      !Array.isArray(data.items) ||
      !data.items.length
    ) {

      return m.reply(

`༺ 𝙎𝚒𝚗 𝚌𝚘𝚗𝚝𝚎𝚗𝚒𝚍𝚘 ༻

✰ 𝙽𝚘 𝚜𝚎 𝚎𝚗𝚌𝚘𝚗𝚝𝚛ó 𝚌𝚘𝚗𝚝𝚎𝚗𝚒𝚍𝚘 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚋𝚕𝚎.

✰ 𝙿𝚞𝚎𝚍𝚎 𝚜𝚎𝚛 𝚙𝚛𝚒𝚟𝚊𝚍𝚘, 𝚎𝚕𝚒𝚖𝚒𝚗𝚊𝚍𝚘 𝚘 𝚗𝚘 𝚍𝚒𝚜𝚙𝚘𝚗𝚒𝚋𝚕𝚎.

✰ ${config.botName || 'SaitamaBot'}`
      )
    }


    // ═══════════════════════════════════
    // ✰ OBTENER ITEMS
    // ═══════════════════════════════════

    const items =
      data.items
        .filter(
          item =>
            item &&
            item.url
        )
        .slice(0, 10)


    if (!items.length) {

      return m.reply(

`༺ 𝙴𝚛𝚛𝚘𝚛 ༻

✰ 𝙻𝚊 𝙰𝙿𝙸 𝚗𝚘 𝚍𝚎𝚟𝚘𝚕𝚟𝚒ó 𝚎𝚗𝚕𝚊𝚌𝚎𝚜 𝚟á𝚕𝚒𝚍𝚘𝚜.

✰ ${config.botName || 'SaitamaBot'}`
      )
    }


    // ═══════════════════════════════════
    // ✰ SEPARAR VIDEO Y AUDIO
    // ═══════════════════════════════════

    const videos =
      items.filter(
        item =>
          item.type === 'video'
      )


    const audios =
      items.filter(
        item =>
          item.type === 'audio'
      )


    // ═══════════════════════════════════
    // ✰ ENVIAR VIDEO
    // ═══════════════════════════════════

    for (
      const video of videos
    ) {

      await sendVideo(
        conn,
        m,
        video
      )

    }


    // ═══════════════════════════════════
    // ✰ ENVIAR AUDIO
    // ═══════════════════════════════════

    for (
      const audio of audios
    ) {

      await sendAudio(
        conn,
        m,
        audio
      )

    }


    // ═══════════════════════════════════
    // ✰ REACCIÓN FINAL
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
    // ✰ REACCIÓN DE ERROR
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


    console.error(
      '[SAITAMABOT] Instagram API:',
      error?.response?.data ||
      error?.message ||
      error
    )


    return m.reply(

`༺ 𝙴𝚛𝚛𝚘𝚛 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 ༻

✰ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚍𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚛 𝚎𝚕 𝚌𝚘𝚗𝚝𝚎𝚗𝚒𝚍𝚘.

✰ 𝙸𝚗𝚝𝚎𝚗𝚝𝚊 𝚗𝚞𝚎𝚟𝚊𝚖𝚎𝚗𝚝𝚎 𝚌𝚘𝚗 𝚘𝚝𝚛𝚘 𝚎𝚗𝚕𝚊𝚌𝚎.

✰ ${String(
  error?.response?.data?.message ||
  error?.message ||
  'Error desconocido'
).slice(0, 300)}

✰ ${config.botName || 'SaitamaBot'}`
    )
  }
}


// ═══════════════════════════════════════
// ✰ CONFIGURACIÓN
// ═══════════════════════════════════════

handler.help = [

  'instagram <link>',
  'ig <link>',
  'reel <link>',
  'igdl <link>',
  'instagramdl <link>'

]


handler.tags = [
  'descargas'
]


handler.command = [

  'ig',
  'instagram',
  'reel',
  'igdl',
  'instagramdl'

]


handler.register = false
