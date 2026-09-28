import axios from 'axios'
import config from '../../config.js'


// ═══════════════════════════════════════
// ✰ SAITAMABOT • SPOTIFY SEARCH
// ═══════════════════════════════════════

global.spotifyCache =
  global.spotifyCache || {}


const CACHE_TIME =
  10 * 60 * 1000


const API_URL =
  'https://api.lempi.lat/s/sp'


const API_KEY =
  'lem_fe9463d34eeb2708aea45ffdefd6f852f5361f01'


const BOT_NAME =
  config.botName ||
  '𝚂𝙰𝙸𝚃𝙰𝙼𝙰𝙱𝙾𝚃'


// ═══════════════════════════════════════
// ✰ SPOTIFY SEARCH
// ═══════════════════════════════════════

async function searchSpotify(
  query,
  limit = 10
) {

  if (!query?.trim()) {

    throw new Error(
      '𝙻𝚊 𝚋ú𝚜𝚚𝚞𝚎𝚍𝚊 𝚎𝚜𝚝á 𝚟𝚊𝚌í𝚊.'
    )

  }


  limit =
    Math.min(
      Math.max(
        Number(limit) || 10,
        1
      ),
      10
    )


  const response =
    await axios.get(

      API_URL,

      {

        params: {

          q:
            query.trim(),

          limit,

          apikey:
            API_KEY

        },

        timeout:
          20000

      }

    )


  const data =
    response?.data


  if (!data) {

    throw new Error(
      '𝙻𝚊 𝙰𝙿𝙸 𝚗𝚘 𝚍𝚎𝚟𝚘𝚕𝚟𝚒ó 𝚞𝚗𝚊 𝚛𝚎𝚜𝚙𝚞𝚎𝚜𝚝𝚊.'
    )

  }


  if (data.status === false) {

    throw new Error(
      data.message ||
      '𝙻𝚊 𝙰𝙿𝙸 𝚛𝚎𝚌𝚑𝚊𝚣ó 𝚕𝚊 𝚋ú𝚜𝚚𝚞𝚎𝚍𝚊.'
    )

  }


  const tracks =
    data
      ?.resultados
      ?.canciones || []


  if (!Array.isArray(tracks)) {

    return []

  }


  return tracks.map(
    track => {

      const id =
        String(
          track?.id || ''
        )


      const title =
        track?.titulo ||
        '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘'


      const artists =
        Array.isArray(
          track?.artistas
        )
          ? track.artistas
              .map(
                artist =>
                  artist?.nombre
              )
              .filter(Boolean)
          : []


      const artist =
        artists.length
          ? artists.join(', ')
          : '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘'


      const album =
        track?.album?.nombre ||
        '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘'


      const image =
        track?.album?.imagen ||
        null


      const durationMs =
        Number(
          track?.duracion_ms || 0
        )


      const spotifyUrl =
        track?.url ||
        (
          id
            ? `https://open.spotify.com/track/${id}`
            : `https://open.spotify.com/search/${encodeURIComponent(
                `${title} ${artist}`
              )}`
        )


      return {

        id,

        title,

        name:
          title,

        artist,

        artists:
          track?.artistas || [],

        album,

        albumData:
          track?.album || null,

        image,

        cover:
          image,

        duration:
          formatDuration(
            durationMs
          ),

        durationMs,

        url:
          spotifyUrl,

        spotifyUrl,

        explicit:
          Boolean(
            track?.explicito
          ),

        publish:
          '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘',

        year:
          track?.album?.año ||
          '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘'

      }

    }
  )

}


// ═══════════════════════════════════════
// ✰ FORMATO DURACIÓN
// ═══════════════════════════════════════

function formatDuration(ms) {

  if (
    !ms ||
    ms <= 0
  ) {

    return '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚊'

  }


  const minutes =
    Math.floor(
      ms / 60000
    )


  const seconds =
    Math.floor(
      (ms % 60000) / 1000
    )


  return `${minutes}:${String(
    seconds
  ).padStart(2, '0')}`

}


// ═══════════════════════════════════════
// ✰ OBTENER USUARIO
// ═══════════════════════════════════════

function getSender(m) {

  return (
    m.sender ||
    m.key?.participant ||
    m.participant ||
    m.chat
  )

}


// ═══════════════════════════════════════
// ✰ LIMPIAR CACHE
// ═══════════════════════════════════════

function cleanSpotifyCache(
  sender
) {

  const cache =
    global.spotifyCache?.[
      sender
    ]


  if (!cache) {

    return null

  }


  if (
    Date.now() -
    cache.time >
    CACHE_TIME
  ) {

    delete global.spotifyCache[
      sender
    ]

    return null

  }


  return cache

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

  try {

    const sender =
      getSender(m)


    // ═════════════════════════════════
    // ✰ SIGUIENTE
    // ═════════════════════════════════

    if (
      command === 'spnext' ||
      command === 'spotify-next' ||
      command === 'spotify_next'
    ) {

      const cache =
        cleanSpotifyCache(
          sender
        )


      if (
        !cache ||
        !Array.isArray(
          cache.results
        ) ||
        !cache.results.length
      ) {

        return m.reply(

`༺ 𝚂𝙸𝙽 𝙱Ú𝚂𝚀𝚄𝙴𝙳𝙰 ༻

✰ 𝙽𝚘 𝚑𝚊𝚢 𝚞𝚗𝚊 𝚋ú𝚜𝚚𝚞𝚎𝚍𝚊 𝚊𝚗𝚝𝚎𝚛𝚒𝚘𝚛.

✰ 𝚄𝚜𝚊:
${usedPrefix}spotify <texto>

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
${usedPrefix}spotify The Weeknd

✰ ${BOT_NAME}`

        )

      }


      cache.index++


      if (
        cache.index >=
        cache.results.length
      ) {

        cache.index = 0

      }


      cache.time =
        Date.now()


      await conn.sendMessage(
        m.chat,
        {
          react: {
            text:
              '🔎',
            key:
              m.key
          }
        }
      ).catch(() => {})


      await sendSpotifyCard(
        conn,
        m,
        cache.results,
        cache.index,
        usedPrefix
      )


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
      ).catch(() => {})


      return

    }


    // ═════════════════════════════════
    // ✰ SIN TEXTO
    // ═════════════════════════════════

    const query =
      String(
        text || ''
      ).trim()


    if (!query) {

      return m.reply(

`༺ 𝚂𝙿𝙾𝚃𝙸𝙵𝚈 ༻

✰ 𝙸𝚗𝚐𝚛𝚎𝚜𝚊 𝚎𝚕 𝚗𝚘𝚖𝚋𝚛𝚎 𝚍𝚎 𝚞𝚗𝚊 𝚌𝚊𝚗𝚌𝚒ó𝚗.

✰ 𝚄𝚜𝚊:
${usedPrefix}${command} <texto>

✰ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘:
${usedPrefix}${command} Twice

✰ ${BOT_NAME}`

      )

    }


    // ═════════════════════════════════
    // ✰ REACCIÓN
    // ═════════════════════════════════

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
    ).catch(() => {})


    // ═════════════════════════════════
    // ✰ BUSCANDO
    // ═════════════════════════════════

    const searchMsg =
      await m.reply(

`༺ 𝙱𝚄𝚂𝙲𝙰𝙽𝙳𝙾 𝚂𝙿𝙾𝚃𝙸𝙵𝚈 ༻

✰ 𝙱𝚞𝚜𝚌𝚊𝚗𝚍𝚘:
${query}

✰ 𝙴𝚜𝚙𝚎𝚛𝚊 𝚞𝚗 𝚖𝚘𝚖𝚎𝚗𝚝𝚘...

✰ ${BOT_NAME}`

      )


    // ═════════════════════════════════
    // ✰ BUSCAR
    // ═════════════════════════════════

    const results =
      await searchSpotify(
        query,
        10
      )


    // ═════════════════════════════════
    // ✰ SIN RESULTADOS
    // ═════════════════════════════════

    if (
      !results ||
      !results.length
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
      ).catch(() => {})


      return

    }


    // ═════════════════════════════════
    // ✰ GUARDAR CACHE
    // ═════════════════════════════════

    global.spotifyCache[
      sender
    ] = {

      query,

      index:
        0,

      results,

      time:
        Date.now()

    }


    // ═════════════════════════════════
    // ✰ EDITAR BUSCANDO
    // ═════════════════════════════════

    await conn.sendMessage(
      m.chat,
      {
        edit:
          searchMsg.key,

        text:

`༺ 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂 𝚂𝙿𝙾𝚃𝙸𝙵𝚈 ༻

✰ 𝙴𝚗𝚌𝚘𝚗𝚝𝚛𝚊𝚍𝚘𝚜:
${results.length}

✰ ${BOT_NAME}`
      }
    ).catch(() => {})


    // ═════════════════════════════════
    // ✰ MOSTRAR RESULTADO
    // ═════════════════════════════════

    await sendSpotifyCard(
      conn,
      m,
      results,
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
          text:
            '✅',
          key:
            m.key
        }
      }
    ).catch(() => {})


  } catch (error) {

    console.error(
      '[SPOTIFY SEARCH]',
      error?.response?.data ||
      error?.message ||
      error
    )


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
    ).catch(() => {})


    return m.reply(

`༺ 𝙴𝚁𝚁𝙾𝚁 𝚂𝙿𝙾𝚃𝙸𝙵𝚈 ༻

✰ 𝙽𝚘 𝚜𝚎 𝚙𝚞𝚍𝚘 𝚛𝚎𝚊𝚕𝚒𝚣𝚊𝚛 𝚕𝚊 𝚋ú𝚜𝚚𝚞𝚎𝚍𝚊.

✰ 𝙸𝚗𝚝𝚎𝚗𝚝𝚊 𝚍𝚎 𝚗𝚞𝚎𝚟𝚘.

✰ ${BOT_NAME}`

    )

  }

}


// ═══════════════════════════════════════
// ✰ TARJETA SPOTIFY
// ═══════════════════════════════════════

async function sendSpotifyCard(
  conn,
  m,
  results,
  index,
  usedPrefix
) {

  const song =
    results[index]


  if (!song) {

    return m.reply(

`༺ 𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾 𝙸𝙽𝚅Á𝙻𝙸𝙳𝙾 ༻

✰ 𝙽𝚘 𝚎𝚡𝚒𝚜𝚝𝚎 𝚎𝚜𝚎 𝚛𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘.

✰ ${BOT_NAME}`

    )

  }


  // ═════════════════════════════════
  // ✰ DATOS
  // ═════════════════════════════════

  const title =
    song.title ||
    song.name ||
    '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘'


  const artist =
    song.artist ||
    '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘'


  const album =
    song.album ||
    '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘'


  const duration =
    song.duration ||
    '𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚊'


  const image =
    song.image ||
    song.cover ||
    null


  const spotifyUrl =
    song.spotifyUrl ||
    song.url ||
    ''


  // ═════════════════════════════════
  // ✰ INFORMACIÓN
  // ═════════════════════════════════

const infoText =
`*༺═────── ✰ ──────═༻*
*༻ 𝚂𝙿𝙾𝚃𝙸𝙵𝚈 ✰*

*༻ 𝚃í𝚝𝚞𝚕𝚘:* *${title}*
*༻ 𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* *${artist}*
*༻ Á𝚕𝚋𝚞𝚖:* *${album}*
*༻ 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* *${duration}*
*༻ 𝚁𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘:* *${index + 1}/${results.length}*

*༺═────── ✰ ──────═༻*
*✰ 𝙴𝚕𝚒𝚐𝚎 𝚞𝚗𝚊 𝚘𝚙𝚌𝚒ó𝚗*
✰ ╰┈➤ 𝟮𝟬𝟮𝟲`


  // ═════════════════════════════════
  // ✰ BOTONES
  // ═════════════════════════════════

  const buttons = [

    {

      text:
        '✦ 𝙵𝙾𝚁𝙼𝙰𝚃𝙾 ✦',

      sections: [

        // ═══════════════════════════
        // ✰ AUDIO
        // ═══════════════════════════

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
                `${usedPrefix}spotifymp3 ${spotifyUrl}`

            },

            {

              title:
                '📄 ❯ 𝙼𝙿𝟹 𝙳𝙾𝙲',

              description:
                '✰ 𝙰𝚞𝚍𝚒𝚘 𝚌𝚘𝚖𝚘 𝚍𝚘𝚌𝚞𝚖𝚎𝚗𝚝𝚘',

              id:
                `${usedPrefix}spotifymp3doc ${spotifyUrl}`

            }

          ]

        },


        // ═══════════════════════════
        // ✰ SPOTIFY
        // ═══════════════════════════

        {

          title:
            '╭─〔 𝚂𝙿𝙾𝚃𝙸𝙵𝚈 〕─╮',

          rows: [

            {

              title:
                '🎵 ❯ 𝙰𝙱𝚁𝙸𝚁 𝚂𝙿𝙾𝚃𝙸𝙵𝚈',

              description:
                '✰ 𝙰𝚋𝚛𝚒𝚛 𝚕𝚊 𝚌𝚊𝚗𝚌𝚒ó𝚗 𝚎𝚗 𝚂𝚙𝚘𝚝𝚒𝚏𝚢',

              id:
                spotifyUrl

            }

          ]

        },


        // ═══════════════════════════
        // ✰ BÚSQUEDA
        // ═══════════════════════════

        {

          title:
            '╭─〔 𝙱Ú𝚂𝚀𝚄𝙴𝙳𝙰 〕─╮',

          rows: [

            {

              title:
                '➡️ ❯ 𝚂𝙸𝙶𝚄𝙸𝙴𝙽𝚃𝙴',

              description:
                `✰ 𝚅𝚎𝚛 𝚛𝚎𝚜𝚞𝚕𝚝𝚊𝚍𝚘 ${
                  index + 2 >
                  results.length
                    ? 1
                    : index + 2
                }/${results.length}`,

              id:
                `${usedPrefix}spnext`

            }

          ]

        }

      ]

    }

  ]


  // ═════════════════════════════════
  // ✰ CONTENIDO
  // ═════════════════════════════════

  const content = {

    caption:
      infoText,

    footer:
      BOT_NAME,

    buttons

  }


  // ═════════════════════════════════
  // ✰ PORTADA
  // ═════════════════════════════════

  if (image) {

    content.image = {

      url:
        image

    }

  }


  // ═════════════════════════════════
  // ✰ ENVIAR
  // ═════════════════════════════════

  await conn.sendMessage(

    m.chat,

    content,

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

  'spotify <texto>',

  'sp <texto>',

  'spsearch <texto>',

  'spnext'

]


handler.tags = [

  'buscador'

]


handler.command = [

  'spotify',

  'sp',

  'spotifysearch',

  'spsearch',

  'spnext',

  'spotify-next',

  'spotify_next'

]


handler.register = false


export default handler
