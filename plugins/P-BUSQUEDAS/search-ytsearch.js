import axios from 'axios'
import config from '../../config.js'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 API YOUTUBE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_URL = 'https://api.stellarwa.xyz'
const API_KEY = 'proyectsV2'

const BACKUP_API =
  'https://luxinfinity.vercel.app/api/search/youtube'


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    String(text || '').trim()


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ SIN TEXTO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!query) {

    return m.reply(
`✰ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚂𝙴𝙰𝚁𝙲𝙷 ✰

༻ 𝙵𝚊𝚕𝚝𝚊 𝚕𝚊 𝚋ú𝚜𝚚𝚞𝚎𝚍𝚊.

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
> ${usedPrefix}${command} Saitama

༻ 𝙱𝚞𝚜𝚌𝚊 𝚟𝚒𝚍𝚎𝚘𝚜 𝚍𝚎 𝚈𝚘𝚞𝚃𝚞𝚋𝚎`
    )

  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⏳ REACCIÓN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  try {

    await m.react('🔎')

  } catch {}


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔎 BUSCANDO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  await m.reply(
`✰ 𝙱𝚄𝚂𝙲𝙰𝙽𝙳𝙾 ✰

༻ 𝙱ú𝚜𝚚𝚞𝚎𝚍𝚊:
> ${query}

✰ 𝙱𝚞𝚜𝚌𝚊𝚗𝚍𝚘 𝚎𝚗 𝚈𝚘𝚞𝚃𝚞𝚋𝚎...`
  )


  try {

    let results = []


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🌐 API PRINCIPAL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━

    try {

      const url =
        `${API_URL}/search/youtube?query=${encodeURIComponent(query)}&limit=10&key=${API_KEY}`

      const response =
        await axios.get(
          url,
          {
            timeout: 15000
          }
        )

      if (
        response.data?.status &&
        Array.isArray(response.data?.data)
      ) {

        results =
          response.data.data

      } else if (
        Array.isArray(response.data?.data)
      ) {

        results =
          response.data.data

      }

    } catch {}


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔄 API BACKUP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!results.length) {

      try {

        const url =
          `${BACKUP_API}?query=${encodeURIComponent(query)}&limit=10`

        const response =
          await axios.get(
            url,
            {
              timeout: 15000
            }
          )

        if (
          Array.isArray(
            response.data?.data
          )
        ) {

          results =
            response.data.data

        }

      } catch {}

    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ SIN RESULTADOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!results.length) {

      try {
        await m.react('❌')
      } catch {}

      return m.reply(
`✰ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 ✰

༻ 𝙽𝚘 𝚜𝚎 𝚎𝚗𝚌𝚘𝚗𝚝𝚛𝚊𝚛𝚘𝚗 𝚛𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘𝚜.
✰ 𝙱ú𝚜𝚚𝚞𝚎𝚍𝚊:
> ${query}`
      )

    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ MINIATURA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const first =
      results[0]

    const thumbnail =
      first?.thumb ||
      first?.thumbnail ||
      first?.image ||
      null


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 INFORMACIÓN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let caption =
`✰ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚂𝙴𝙰𝚁𝙲𝙷 ✰

༻ 𝙱ú𝚜𝚚𝚞𝚎𝚍𝚊:
> ${query}
✰ 𝚁𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘𝚜:
> ${Math.min(results.length, 10)}

`


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎵 RESULTADOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━

    results
      .slice(0, 10)
      .forEach(
        (video, index) => {

          const title =
            video.title ||
            'Desconocido'

          const author =
            video.author?.name ||
            video.author ||
            'Desconocido'

          const duration =
            video.duration?.text ||
            'Desconocida'

          const views =
            video.views ||
            'No disponible'

          const published =
            video.publishDate ||
            'No disponible'

          const url =
            video.url ||
            (
              video.id
                ? `https://youtu.be/${video.id}`
                : 'Sin enlace'
            )


caption +=
`✰ ${index + 1}. _*${title}*_
༻ _*𝙰𝚛𝚝𝚒𝚜𝚝𝚊:*_> * ${author}*
༻ _*𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:*_> * ${duration}*
༻ _*𝚅𝚒𝚜𝚝𝚊𝚜:*_> * ${views}*
༻ _*𝙿𝚞𝚋𝚕𝚒𝚌𝚊𝚍𝚘:*_> * ${published}*
༻ _*𝙻𝚒𝚗𝚔:*_> * ${url}*

*༺═────── ✰ ──────═༻*

`
        }
      )


    caption +=
`༻ 𝙱ú𝚜𝚚𝚞𝚎𝚍𝚊 𝚌𝚘𝚖𝚙𝚕𝚎𝚝𝚊𝚍𝚊 ✰`


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ ENVIAR CON MINIATURA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (thumbnail) {

      try {

        const imageResponse =
          await axios.get(
            thumbnail,
            {
              responseType: 'arraybuffer',
              timeout: 15000
            }
          )

        await conn.sendMessage(
          m.chat,
          {
            image:
              Buffer.from(
                imageResponse.data
              ),

            caption
          },
          {
            quoted: m
          }
        )

      } catch {

        await m.reply(
          caption
        )

      }

    } else {

      await m.reply(
        caption
      )

    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ FINALIZADO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━

    try {
      await m.react('✅')
    } catch {}


  } catch (error) {

    console.error(
      '[YTSEARCH]',
      error?.message
    )

    try {
      await m.react('❌')
    } catch {}

    return m.reply(
`✰ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚂𝙴𝙰𝚁𝙲𝙷 ✰

༻ 𝙾𝚌𝚞𝚛𝚛𝚒ó 𝚞𝚗 𝚎𝚛𝚛𝚘𝚛.

✰ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚌𝚘𝚖𝚙𝚕𝚎𝚝𝚊𝚛 𝚕𝚊 𝚋ú𝚜𝚚𝚞𝚎𝚍𝚊.

༻ 𝙸𝚗𝚝𝚎𝚗𝚝𝚊 𝚍𝚎 𝚗𝚞𝚎𝚟𝚘.`
    )

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIGURACIÓN DEL PLUGIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

handler.help = [
  'ytsearch <texto>',
  'yts <texto>'
]

handler.tags = [
  'busquedas'
]

handler.command = [
  'yts',
  'ytsearch',
  'youtube',
  'buscarvideo'
]

handler.register = false

export default handler
