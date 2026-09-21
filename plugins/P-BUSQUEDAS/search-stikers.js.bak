import axios from 'axios'
import sharp from 'sharp'

// ✰ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝙻𝚈 ✰

const API_URL =
  'https://luxinfinity.vercel.app/api/search/sticker'

const MAX_STICKERS = 10

const API_TIMEOUT = 120000

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'


// ✰ BUSCAR PACK

async function searchStickerPack(query) {

  const response = await axios.get(
    API_URL,
    {
      params: {
        text: query,
        limit: MAX_STICKERS
      },

      timeout: API_TIMEOUT,

      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json'
      }
    }
  )

  const data = response?.data

  if (!data?.status || !data?.data) {
    throw new Error(
      'La API no devolvió resultados.'
    )
  }

  const result = data.data

  if (
    !Array.isArray(result.fotos) ||
    !result.fotos.length
  ) {
    throw new Error(
      'No se encontraron stickers.'
    )
  }

  return {
    nombre:
      result.nombre ||
      'Sticker Pack',

    creador:
      result.creador ||
      'Desconocido',

    total:
      Number(result.total) ||
      result.fotos.length,

    fotos:
      result.fotos
        .filter(
          url =>
            typeof url === 'string' &&
            /^https?:\/\//i.test(url)
        )
        .slice(0, MAX_STICKERS),

    url:
      result.url || null
  }
}


// ✰ DESCARGAR IMAGEN

async function downloadImage(url) {

  const response = await axios.get(
    url,
    {
      responseType: 'arraybuffer',

      timeout: API_TIMEOUT,

      maxContentLength: Infinity,
      maxBodyLength: Infinity,

      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'image/png,image/jpeg,image/webp,image/*,*/*'
      }
    }
  )

  if (
    !response.data ||
    response.data.length === 0
  ) {
    throw new Error(
      'Imagen vacía.'
    )
  }

  return Buffer.from(response.data)
}


// ✰ CONVERTIR A STICKER

async function convertToSticker(buffer) {

  return await sharp(buffer)
    .resize(
      512,
      512,
      {
        fit: 'contain',

        background: {
          r: 0,
          g: 0,
          b: 0,
          alpha: 0
        }
      }
    )
    .webp({
      quality: 90
    })
    .toBuffer()
}


// ✰ HANDLER

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


  if (!query) {

    return m.reply(
`༺ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝙻𝚈 ༻

✰ Falta la búsqueda.

✰ Ejemplo:
${usedPrefix + command} Naruto`
    )
  }


  await m.react('⏳').catch(() => {})


  try {

    // ✰ BUSCAR PACK

    const pack =
      await searchStickerPack(query)


    const stickers =
      pack.fotos.slice(
        0,
        MAX_STICKERS
      )


    if (!stickers.length) {

      await m.react('❌').catch(() => {})

      return m.reply(
`༺ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝙻𝚈 ༻

✰ No se encontraron stickers.`
      )
    }


    // ✰ INFORMACIÓN

    await m.reply(
`༺ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝙻𝚈 ༻

✰ Pack: ${pack.nombre}
✰ Creador: ${pack.creador}
✰ Stickers: ${stickers.length}/10

✰ Enviando pack...`
    )


    // ✰ ENVIAR STICKERS

    let enviados = 0


    for (
      let i = 0;
      i < stickers.length;
      i++
    ) {

      try {

        const image =
          await downloadImage(
            stickers[i]
          )


        const sticker =
          await convertToSticker(
            image
          )


        await conn.sendMessage(
          m.chat,
          {
            sticker,

            packname:
              pack.nombre,

            author:
              `༺ ${pack.creador} ༻`
          },
          {
            quoted:
              i === 0
                ? m
                : undefined
          }
        )


        enviados++


        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              300
            )
        )

      } catch {
        continue
      }
    }


    if (!enviados) {

      await m.react('❌').catch(() => {})

      return m.reply(
`༺ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝙻𝚈 ༻

✰ No se pudo enviar ningún sticker.`
      )
    }


    await m.react('✅').catch(() => {})


    return m.reply(
`༺ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝙻𝚈 ༻

✰ Pack: ${pack.nombre}
✰ Creador: ${pack.creador}
✰ Enviados: ${enviados}/${stickers.length}

✰ 𝚂𝚊𝚒𝚝𝚊𝚖𝚊𝙱𝚘𝚝`
    )


  } catch (error) {

    await m.react('❌').catch(() => {})

    return m.reply(
`༺ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝙻𝚈 ༻

✰ No se pudo completar la búsqueda.

✰ Error:
${String(
  error?.message ||
  error ||
  'Error desconocido'
).slice(0, 400)}`
    )
  }
}


// ✰ CONFIGURACIÓN

handler.help = [
  'buscarsticker <búsqueda>',
  'stickerly <búsqueda>'
]

handler.tags = [
  'busquedas'
]

handler.command = [
  'buscarsticker',
  'stickerly',
  'sly'
]

export default handler