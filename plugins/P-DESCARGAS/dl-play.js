import axios from 'axios'
import ytsearch from 'yt-search'
import config from '../../config.js'


// ═══════════════════════════════════════
// ✰ SAITAMABOT • YOUTUBE SEARCH
// ═══════════════════════════════════════

global.youtubeCache =
  global.youtubeCache || {}


const LUXINFINITY =
  'https://luxinfinity.vercel.app/api/search/youtube'


const BOT_NAME =
  config.botName ||
  '𝑺𝒂𝒊𝒕𝒂𝒎𝒂𝑩𝒐𝒕'


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

  try {

    // ═════════════════════════════════
    // ✰ SIGUIENTE RESULTADO
    // ═════════════════════════════════

    if (
      command === 'playnext'
    ) {

      const dataUser =
        global.youtubeCache[
          m.sender
        ]


      if (
        !dataUser ||
        !dataUser.results?.length
      ) {

        return m.reply(

`༺ 𝚂𝙸𝙽 𝙱Ú𝚂𝚀𝚄𝙴𝙳𝙰 ༻

✰ 𝙽𝚘 𝚑𝚊𝚢 𝚋ú𝚜𝚚𝚞𝚎𝚍𝚊.

✰ 𝚄𝚜𝚊:
${usedPrefix}play <texto>

✰ ${BOT_NAME}`
        )
      }


      dataUser.index++


      if (
        dataUser.index >=
        dataUser.results.length
      ) {

        dataUser.index = 0
      }


      return sendYoutubeCard(
        conn,
        m,
        dataUser.results,
        dataUser.index,
        usedPrefix
      )
    }


    // ═════════════════════════════════
    // ✰ SIN TEXTO
    // ═════════════════════════════════

    if (
      !text?.trim()
    ) {

      return m.reply(

`༺ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 ༻

✰ 𝚄𝚜𝚊:
${usedPrefix}${command} <texto>

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
${usedPrefix}${command} Twice

✰ ${BOT_NAME}`
      )
    }


    const query =
      text.trim()


    // ═════════════════════════════════
    // ✰ REACCIÓN
    // ═════════════════════════════════

    await conn.sendMessage(
      m.chat,
      {
        react: {
          text: '⏳',
          key: m.key
        }
      }
    ).catch(() => {})


    // ═════════════════════════════════
    // ✰ BUSCANDO
    // ═════════════════════════════════

    const searchMsg =
      await m.reply(

`༺ 𝙱𝚄𝚂𝙲𝙰𝙽𝙳𝙾 ༻

✰ 𝙱𝚞𝚜𝚌𝚊𝚗𝚍𝚘:
${query}

✰ ${BOT_NAME}`
      )


    let videos = []


    // ═════════════════════════════════
    // ✰ YT-SEARCH
    // ═════════════════════════════════

    try {

      const searchResult =
        await ytsearch(
          query
        )


      if (
        searchResult?.videos?.length
      ) {

        videos =
          searchResult.videos
            .slice(
              0,
              10
            )
            .map(
              v => ({

                title:
                  v.title ||
                  'Sin título',

                author:
                  v.author?.name ||
                  'Desconocido',

                duration:
                  v.timestamp ||
                  'Desconocida',

                views:
                  Number(
                    v.views || 0
                  ).toLocaleString(),

                publishedAt:
                  v.ago ||
                  'Desconocido',

                videoId:
                  v.videoId,

                thumbnail:
                  v.image,

                url:
                  v.url

              })
            )
            .filter(
              v =>
                v.videoId &&
                v.url
            )
      }

    } catch {}


    // ═════════════════════════════════
    // ✰ API SECUNDARIA
    // ═════════════════════════════════

    if (
      !videos.length
    ) {

      try {

        const {
          data
        } =
          await axios.get(
            LUXINFINITY,
            {
              params: {

                query:
                  query,

                limit:
                  10
              },

              timeout:
                30000
            }
          )


        if (
          data?.status &&
          Array.isArray(
            data?.data
          ) &&
          data.data.length
        ) {

          videos =
            data.data
              .slice(
                0,
                10
              )
              .map(
                v => ({

                  title:
                    v.title ||
                    'Sin título',

                  author:
                    v.author?.name ||
                    'Desconocido',

                  duration:
                    v.duration?.text ||
                    v.duration?.timestamp ||
                    'Desconocida',

                  views:
                    Number(
                      v.views || 0
                    ).toLocaleString(),

                  publishedAt:
                    v.publishDate ||
                    'Desconocido',

                  videoId:
                    v.id ||
                    v.videoId,

                  thumbnail:
                    v.thumb ||
                    v.thumbnail ||
                    v.image,

                  url:
                    v.url

                })
              )
              .filter(
                v =>
                  v.videoId &&
                  v.url
              )
        }

      } catch {}
    }


    // ═════════════════════════════════
    // ✰ SIN RESULTADOS
    // ═════════════════════════════════

    if (
      !videos.length
    ) {

      await conn.sendMessage(
        m.chat,
        {
          edit:
            searchMsg.key,

          text:

`༺ 𝚂𝙸𝙽 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂 ༻

✰ 𝙽𝚘 𝚎𝚗𝚌𝚘𝚗𝚝𝚛é:
${query}

✰ ${BOT_NAME}`
        }
      ).catch(() => {})


      return
    }


    // ═════════════════════════════════
    // ✰ GUARDAR RESULTADOS
    // ═════════════════════════════════

    global.youtubeCache[
      m.sender
    ] = {

      query:
        query,

      index:
        0,

      results:
        videos
    }


    // ═════════════════════════════════
    // ✰ EDITAR MENSAJE
    // ═════════════════════════════════

    await conn.sendMessage(
      m.chat,
      {
        edit:
          searchMsg.key,

        text:

`༺ 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾 ༻

✰ 𝙴𝚗𝚌𝚘𝚗𝚝𝚛𝚊𝚍𝚘𝚜:
${videos.length}

✰ ${BOT_NAME}`
      }
    ).catch(() => {})


    // ═════════════════════════════════
    // ✰ MOSTRAR RESULTADO
    // ═════════════════════════════════

    await sendYoutubeCard(
      conn,
      m,
      videos,
      0,
      usedPrefix
    )


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


  } catch {

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

`༺ 𝙴𝚁𝚁𝙾𝚁 ༻

✰ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚋𝚞𝚜𝚌𝚊𝚛.

✰ 𝙸𝚗𝚝𝚎𝚗𝚝𝚊 𝚍𝚎 𝚗𝚞𝚎𝚟𝚘.

✰ ${BOT_NAME}`
    )
  }
}


// ═══════════════════════════════════════
// ✰ TARJETA YOUTUBE
// ═══════════════════════════════════════

async function sendYoutubeCard(
  conn,
  m,
  results,
  index,
  usedPrefix
) {

  const video =
    results[index]


  if (!video) {

    return m.reply(

`༺ 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾 𝙸𝙽𝚅Á𝙻𝙸𝙳𝙾 ༻

✰ 𝙽𝚘 𝚎𝚡𝚒𝚜𝚝𝚎.

✰ ${BOT_NAME}`
    )
  }


  // ═════════════════════════════════
  // ✰ INFORMACIÓN
  // ═════════════════════════════════

const infoText =
`*༺═────── ✰ ──────═༻*
*༻ 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 ✰*

*༻ 𝚃í𝚝𝚞𝚕𝚘:* *${video.title}*
*༻ 𝙲𝚊𝚗𝚊𝚕:* *${video.author}*
*༻ 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* *${video.duration}*
*༻ 𝚅𝚒𝚜𝚝𝚊𝚜:* *${video.views}*
*༻ 𝙿𝚞𝚋𝚕𝚒𝚌𝚊𝚍𝚘:* *${video.publishedAt}*
*༻ 𝚁𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘:* *${index + 1}/${results.length}*

*༺═────── ✰ ──────═༻*`
✰ ╰┈➤ 𝟮𝟬𝟮𝟲`


  // ═════════════════════════════════
  // ✰ BOTONES
  // ═════════════════════════════════

  const buttons = [

    {
      text:
        '✦ 𝙵𝙾𝚁𝙼𝙰𝚃𝙾 ✦',

      sections: [

        {
          title:
            '╭─〔 𝙰𝚄𝙳𝙸𝙾 〕─╮',

          rows: [

            {
              title:
                '🎵 ❯ 𝙼𝙿𝟹',

              description:
                '✰ 𝙳𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚛 𝚊𝚞𝚍𝚒𝚘',

              id:
                `${usedPrefix}ytmp3 ${video.videoId}`
            },

            {
              title:
                '📄 ❯ 𝙼𝙿𝟹 𝙳𝙾𝙲',

              description:
                '✰ 𝙰𝚞𝚍𝚒𝚘 𝚌𝚘𝚖𝚘 𝚍𝚘𝚌𝚞𝚖𝚎𝚗𝚝𝚘',

              id:
                `${usedPrefix}ytmp3doc ${video.videoId}`
            }

          ]
        },

        {
          title:
            '╭─〔 𝚅𝙸𝙳𝙴𝙾 〕─╮',

          rows: [

            {
              title:
                '🎬 ❯ 𝙼𝙿𝟺',

              description:
                '✰ 𝙳𝚎𝚜𝚌𝚊𝚛𝚐𝚊𝚛 𝚟í𝚍𝚎𝚘',

              id:
                `${usedPrefix}ytmp4 ${video.url}`
            },

            {
              title:
                '📁 ❯ 𝙼𝙿𝟺 𝙳𝙾𝙲',

              description:
                '✰ 𝚅í𝚍𝚎𝚘 𝚌𝚘𝚖𝚘 𝚍𝚘𝚌𝚞𝚖𝚎𝚗𝚝𝚘',

              id:
                `${usedPrefix}ytmp4doc ${video.url}`
            }

          ]
        },

        {
          title:
            '╭─〔 𝙱Ú𝚂𝚀𝚄𝙴𝙳𝙰 〕─╮',

          rows: [

            {
              title:
                '➡️ ❯ 𝚂𝙸𝙶𝚄𝙸𝙴𝙽𝚃𝙴',

              description:
                `✰ ${index + 2 > results.length
                  ? 1
                  : index + 2}/${results.length}`,

              id:
                `${usedPrefix}playnext`
            }

          ]
        }

      ]
    }

  ]


  // ═════════════════════════════════
  // ✰ ENVIAR TARJETA
  // ═════════════════════════════════

  await conn.sendMessage(
    m.chat,
    {

      image: {
        url:
          video.thumbnail
      },

      caption:
        infoText,

      footer:
        BOT_NAME,

      buttons

    },
    {
      quoted:
        m
    }
  )
}


// ═══════════════════════════════════════
// ✰ CONFIGURACIÓN
// ═══════════════════════════════════════

handler.help = [
  'play <texto>',
  'playnext'
]


handler.tags = [
  'descargas'
]


handler.command = [
  'play',
  'play2',
  'play3',
  'playnext'
]


handler.register = false


export default handler
