import * as baileysMod from '@whiskeysockets/baileys'
import config from '../../config.js'
import { plugins } from '../../handler.js'

const pkg =
  baileysMod.default &&
  Object.keys(baileysMod).length === 1
    ? baileysMod.default
    : baileysMod

const {
  prepareWAMessageMedia,
  generateWAMessageFromContent
} = pkg

const START_TIME = Date.now()

const IMAGENES = [
  'https://files.catbox.moe/dkxngv.png',
  'https://files.catbox.moe/a8id3b.png',
  'https://files.catbox.moe/7ess2z.png',
  'https://files.catbox.moe/eb7zb2.png',
  'https://files.catbox.moe/wj6sad.png'
]

/* ═════════════════════════════════════
   CATEGORÍAS
   NO MODIFICAR
═════════════════════════════════════ */

const ETIQUETAS = {

  info:
    '『 ✦ 』𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝙲𝙸Ó𝙽',

  owner:
    '『 ♛ 』𝙾𝚆𝙽𝙴𝚁 / 𝙳𝚄𝙴Ñ𝙾',

  rpg:
    '『 ⚔ 』𝚁𝙾𝙻 𝚈 𝙰𝚅𝙴𝙽𝚃𝚄𝚁𝙰',

  eco:
    '『 ◈ 』𝙴𝙲𝙾𝙽𝙾𝙼Í𝙰',

  registro:
    '『 ✎ 』𝚁𝙴𝙶𝙸𝚂𝚃𝚁𝙾',

  juegos:
    '『 🎮 』𝙼𝙸𝙽𝙸𝙹𝚄𝙴𝙶𝙾𝚂',

  fun:
    '『 ✧ 』𝙳𝙸𝚅𝙴𝚁𝚂𝙸Ó𝙽',

  group:
    '『 ♟ 』𝙶𝙴𝚂𝚃𝙸Ó𝙽 𝙳𝙴 𝙶𝚁𝚄𝙿𝙾𝚂',

  tools:
    '『 ⚙ 』𝙷𝙴𝚁𝚁𝙰𝙼𝙸𝙴𝙽𝚃𝙰𝚂',

  descargas:
    '『 ⇩ 』𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰𝚂',

  busquedas:
    '『 ⌕ 』𝙱Ú𝚂𝚀𝚄𝙴𝙳𝙰𝚂',

  convertidores:
    '『 ↻ 』𝙲𝙾𝙽𝚅𝙴𝚁𝚃𝙸𝙳𝙾𝚁𝙴𝚂',

  anime:
    '『 ✺ 』𝙰𝙽𝙸𝙼𝙴 / 𝙾𝚃𝙰𝙺𝚄',

  nsfw:
    '『 +18 』𝙲𝙾𝙽𝚃𝙴𝙽𝙸𝙳𝙾',

  jadibot:
    '『 ◉ 』𝚂𝚄𝙱-𝙱𝙾𝚃𝚂',

  ia:
    '『 ▣ 』𝙸𝙽𝚃𝙴𝙻𝙸𝙶𝙴𝙽𝙲𝙸𝙰 𝙰𝚁𝚃𝙸𝙵𝙸𝙲𝙸𝙰𝙻'
}

function getTime() {

  const t =
    Math.floor(
      (Date.now() - START_TIME) / 1000
    )

  const d =
    Math.floor(t / 86400)

  const h =
    Math.floor(
      (t / 3600) % 24
    )

  const min =
    Math.floor(
      (t / 60) % 60
    )

  const s =
    t % 60

  return (
    `${d > 0 ? d + 'd ' : ''}` +
    `${h > 0 ? h + 'h ' : ''}` +
    `${min > 0 ? min + 'm ' : ''}` +
    `${s}s`
  )
}

function getCategorias(
  isOwner,
  groupDb
) {

  const categorias = {}
  let total = 0

  for (
    const p of Object.values(plugins)
  ) {

    if (
      !p ||
      !p.help
    ) continue

    if (
      (p.owner || p.ownerOnly) &&
      !isOwner
    ) continue

    const tagRaw =
      Array.isArray(p.tags)
        ? p.tags[0]
        : (
            p.tags ||
            'otros'
          )

    const tag =
      String(tagRaw).toLowerCase()

    if (
      groupDb &&
      groupDb.disabledCategories?.includes(tag)
    ) {
      continue
    }

    const comandosReales =
      Array.isArray(p.command)
        ? p.command
        : [p.command]

    if (
      groupDb &&
      comandosReales.every(
        c =>
          groupDb.disabledCmds?.includes(c)
      )
    ) {
      continue
    }

    if (!categorias[tag]) {
      categorias[tag] = []
    }

    const comandos =
      Array.isArray(p.help)
        ? p.help
        : [p.help]

    for (
      const cmd of comandos
    ) {

      if (!cmd) continue

      categorias[tag].push(cmd)
      total++
    }
  }

  return {
    categorias,
    total
  }
}

function getOrdenActivo(
  isOwner,
  groupDb
) {

  const {
    categorias,
    total
  } =
    getCategorias(
      isOwner,
      groupDb
    )

  return {
    categorias,
    total,
    ordenFinal:
      Object.keys(categorias)
  }
}

function getContextInfo(
  conn,
  m
) {

  return {

    mentionedJid: [
      m.sender
    ],

    forwardingScore: 999,

    isForwarded: true,

    forwardedNewsletterMessageInfo: {

      newsletterJid:
        global.newsletterJid ||
        '120363408885875268@newsletter',

      newsletterName:
        `${conn.botname || config.botName} - ${config.ownerName}`,

      serverMessageId:
        Math.floor(
          Math.random() * 999
        ) + 1
    }
  }
}

/* ═════════════════════════════════════
   SUBMENÚ
═════════════════════════════════════ */

async function enviarSubmenu(
  conn,
  m,
  tag,
  isOwner,
  usedPrefix,
  groupDb,
  userDb
) {

  const {
    categorias
  } =
    getOrdenActivo(
      isOwner,
      groupDb
    )

  const comandos =
    categorias[tag]

  if (
    !comandos?.length
  ) {

    return m.reply(
`╔══════════════════════╗
║  × 丂卂丨ㄒ卄卂爪卂乃ㄖㄒ
╠══════════════════════╣
║
║  𝙲𝚊𝚝𝚎𝚐𝚘𝚛í𝚊 𝚜𝚒𝚗
║  𝚌𝚘𝚖𝚊𝚗𝚍𝚘𝚜 𝚊𝚌𝚝𝚒𝚟𝚘𝚜.
║
╚══════════════════════╝`
    )
  }

  const nombreCat =
    ETIQUETAS[tag] ||
    ETIQUETAS.otros

  const prefix =
    usedPrefix ||
    config.prefix.source
      .replace(
        /[\^\[\]\\]/g,
        ''
      )[0] ||
    '.'

  const linkCanal =
    config.groupLink ||
    'https://whatsapp.com'

  const currentBotName =
    conn.botname ||
    config.botName

  let caption =

`╔════════════════════════════════╗
║      丂卂丨ㄒ卄卂爪卂乃ㄖㄒ      ║
║        𝙲𝙾𝙼𝙰𝙽𝙳𝙾𝚂             ║
╚════════════════════════════════╝

╭─〔 ${nombreCat} 〕
│
│  ◈ 𝙻𝙸𝚂𝚃𝙰 𝙳𝙴 𝙲𝙾𝙼𝙰𝙽𝙳𝙾𝚂
│
│  ⚡ 𝙼𝙾𝙳𝙾 𝙷É𝚁𝙾𝙴 𝙰𝙲𝚃𝙸𝚅𝙾
│
├────────────────────────────
│
`

  for (
    const cmd of comandos
  ) {

    caption +=
      `│  › ${prefix}${cmd}\n`
  }

  caption +=
`│
├────────────────────────────
│
│  ◈ 𝚃𝙾𝚃𝙰𝙻
│     ${comandos.length} 𝚌𝚘𝚖𝚊𝚗𝚍𝚘𝚜
│
╰─〔 丂卂丨ㄒ卄卂爪卂乃ㄖㄒ 〕`

  const imageUrl =
    conn.menuImage ||
    IMAGENES[
      Math.floor(
        Math.random() *
        IMAGENES.length
      )
    ]

  if (
    conn.noButtons ||
    userDb?.noButtons
  ) {

    return conn.sendMessage(
      m.chat,
      {
        image: {
          url: imageUrl
        },
        caption
      },
      {
        quoted: m
      }
    )
  }

  const media =
    await prepareWAMessageMedia(
      {
        image: {
          url: imageUrl
        }
      },
      {
        upload:
          conn.waUploadToServer
      }
    )

  const msg =
    generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {

          message: {

            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },

            interactiveMessage: {

              body: {
                text: caption
              },

              footer: {
                text:
                  `丂卂丨ㄒ卄卂爪卂乃ㄖㄒ • ${new Date().getFullYear()}`
              },

              header: {
                hasMediaAttachment:
                  true,

                imageMessage:
                  media.imageMessage
              },

              nativeFlowMessage: {

                buttons: [

                  {
                    name:
                      'quick_reply',

                    buttonParamsJson:
                      JSON.stringify({

                        display_text:
                          '↩ 𝚅𝙾𝙻𝚅𝙴𝚁 𝙰𝙻 𝙼𝙴𝙽Ú',

                        id:
                          `${prefix}menu`
                      })
                  },

                  {
                    name:
                      'cta_url',

                    buttonParamsJson:
                      JSON.stringify({

                        display_text:
                          '➤ 𝚂𝙴𝙶𝚄𝙸𝚁 𝙲𝙰𝙽𝙰𝙻',

                        url:
                          linkCanal,

                        merchant_url:
                          linkCanal
                      })
                  }
                ]
              },

              contextInfo:
                getContextInfo(
                  conn,
                  m
                )
            }
          }
        }
      },
      {
        quoted: m
      }
    )

  await conn.relayMessage(
    m.chat,
    msg.message,
    {
      messageId:
        msg.key.id
    }
  )
}

/* ═════════════════════════════════════
   HANDLER PRINCIPAL
═════════════════════════════════════ */

const handler = async (
  m,
  {
    conn,
    usedPrefix,
    isOwner,
    command,
    groupDb,
    userDb
  }
) => {

  const {
    categorias,
    total,
    ordenFinal
  } =
    getOrdenActivo(
      isOwner,
      groupDb
    )

  const numMatch =
    String(command || '')
      .match(
        /^menu(\d+)$/
      )

  if (numMatch) {

    const idx =
      parseInt(
        numMatch[1],
        10
      ) - 1

    const tag =
      ordenFinal[idx]

    if (tag) {

      return enviarSubmenu(
        conn,
        m,
        tag,
        isOwner,
        usedPrefix,
        groupDb,
        userDb
      )
    }

    return m.reply(
`╔══════════════════════╗
║  × 丂卂丨ㄒ卄卂爪卂乃ㄖㄒ
╠══════════════════════╣
║
║  𝙲𝚊𝚝𝚎𝚐𝚘𝚛í𝚊 𝚗𝚘
║  𝚎𝚗𝚌𝚘𝚗𝚝𝚛𝚊𝚍𝚊.
║
╚══════════════════════╝`
    )
  }

  const nombreUsuario =
    m.pushName ||
    'Usuario'

  const prefix =
    usedPrefix ||
    config.prefix.source
      .replace(
        /[\^\[\]\\]/g,
        ''
      )[0] ||
    '.'

  const currentBotName =
    conn.botname ||
    config.botName

  const rows =
    ordenFinal.map(
      (tag, i) => {

        const nombreCat =
          ETIQUETAS[tag] ||
          ETIQUETAS.otros

        const n =
          categorias[tag]?.length ||
          0

        return {

          header:
            nombreCat,

          title:
            '『 丂卂丨ㄒ卄卂爪卂乃ㄖㄒ 』',

          description:
            `› ${n} 𝚌𝚘𝚖𝚊𝚗𝚍𝚘𝚜 • ${prefix}menu${i + 1}`,

          id:
            `menu_cat_${tag}`
        }
      }
    )

  const imageUrl =
    conn.menuImage ||
    IMAGENES[
      Math.floor(
        Math.random() *
        IMAGENES.length
      )
    ]

  if (
    conn.noButtons ||
    userDb?.noButtons
  ) {

    const cats =
      ordenFinal
        .map(
          (tag, i) =>
`│
│  ${String(i + 1).padStart(2, '0')}  ${ETIQUETAS[tag] || tag}
│       › ${categorias[tag]?.length || 0} 𝚌𝚘𝚖𝚊𝚗𝚍𝚘𝚜
│       › ${prefix}menu${i + 1}`
        )
        .join('\n')

    const textoNoBtn =

`╔════════════════════════════════╗
║      丂卂丨ㄒ卄卂爪卂乃ㄖㄒ      ║
║          𝙼𝙴𝙽Ú 𝙿𝚁𝙸𝙽𝙲𝙸𝙿𝙰𝙻   ║
╚════════════════════════════════╝

╭─〔 𝙱𝙸𝙴𝙽𝚅𝙴𝙽𝙸𝙳𝙾 〕
│
│  𝙷𝚘𝚕𝚊, ${nombreUsuario}
│
│  𝙴𝚜𝚝𝚎 𝚎𝚜 𝚎𝚕 𝚌𝚎𝚗𝚝𝚛𝚘
│  𝚍𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘𝚜 𝚍𝚎
│  丂卂丨ㄒ卄卂爪卂乃ㄖㄒ.
│
╰────────────────────────────

╭─〔 𝙴𝚂𝚃𝙰𝙳Í𝚂𝚃𝙸𝙲𝙰𝚂 〕
│
│  ♛ 𝙲𝚛𝚎𝚊𝚍𝚘𝚛
│     ${config.ownerName}
│
│  ⚙ 𝙿𝚛𝚎𝚏𝚒𝚓𝚘
│     ${prefix}
│
│  ◷ 𝙰𝚌𝚝𝚒𝚟𝚘
│     ${getTime()}
│
│  ◈ 𝙲𝚘𝚖𝚊𝚗𝚍𝚘𝚜
│     ${total}
│
╰────────────────────────────

╭─〔 𝙲𝙰𝚃𝙴𝙶𝙾𝚁Í𝙰𝚂 〕
${cats}
╰────────────────────────────

╭─〔 𝚁𝙴𝙳𝙴𝚂 〕
│
│  𝚃𝚒𝚔𝚃𝚘𝚔
│  https://www.tiktok.com/@sai16172
│
╰────────────────────────────

╔════════════════════════════════╗
║      丂卂丨ㄒ卄卂爪卂乃ㄖㄒ      ║
║        ${config.footer}        ║
╚════════════════════════════════╝`

    return conn.sendMessage(
      m.chat,
      {
        image: {
          url: imageUrl
        },
        caption:
          textoNoBtn
      },
      {
        quoted: m
      }
    )
  }

  const textoMenu =

`╔════════════════════════════════╗
║      丂卂丨ㄒ卄卂爪卂乃ㄖㄒ      ║
║          𝙼𝙴𝙽Ú 𝙿𝚁𝙸𝙽𝙲𝙸𝙿𝙰𝙻   ║
╚════════════════════════════════╝

╭─〔 𝙱𝙸𝙴𝙽𝚅𝙴𝙽𝙸𝙳𝙾 〕
│
│  𝙷𝚘𝚕𝚊, ${nombreUsuario}
│
│  𝙱𝚒𝚎𝚗𝚟𝚎𝚗𝚒𝚍𝚘 𝚊𝚕 𝚌𝚎𝚗𝚝𝚛𝚘
│  𝚍𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘𝚜 𝚍𝚎
│  丂卂丨ㄒ卄卂爪卂乃ㄖㄒ.
│
╰────────────────────────────

╭─〔 𝙴𝚂𝚃𝙰𝙳Í𝚂𝚃𝙸𝙲𝙰𝚂 〕
│
│  ♛ 𝙲𝚛𝚎𝚊𝚍𝚘𝚛
│     ${config.ownerName}
│
│  ⚙ 𝙿𝚛𝚎𝚏𝚒𝚓𝚘
│     ${prefix}
│
│  ◷ 𝚃𝚒𝚎𝚖𝚙𝚘 𝚊𝚌𝚝𝚒𝚟𝚘
│     ${getTime()}
│
│  ◈ 𝚃𝚘𝚝𝚊𝚕
│     ${total} 𝚌𝚘𝚖𝚊𝚗𝚍𝚘𝚜
│
╰────────────────────────────

╭─〔 𝙲𝙴𝙽𝚃𝚁𝙾 𝙳𝙴 𝙲𝙾𝙼𝙰𝙽𝙳𝙾𝚂 〕
│
│  𝟶𝟷  𝙰𝚋𝚛𝚎 𝚎𝚕 𝚜𝚎𝚕𝚎𝚌𝚝𝚘𝚛
│  𝟶𝟸  𝙴𝚕𝚒𝚐𝚎 𝚞𝚗𝚊 𝚌𝚊𝚝𝚎𝚐𝚘𝚛í𝚊
│  𝟶𝟹  𝙴𝚡𝚙𝚕𝚘𝚛𝚊 𝚕𝚘𝚜 𝚌𝚘𝚖𝚊𝚗𝚍𝚘𝚜
│
╰────────────────────────────

╭─〔 𝚁𝙴𝙳𝙴𝚂 〕
│
│  ♪ 𝚃𝚒𝚔𝚃𝚘𝚔
│  https://www.tiktok.com/@sai16172
│
╰────────────────────────────

╔════════════════════════════════╗
║      丂卂丨ㄒ卄卂爪卂乃ㄖㄒ      ║
║          ${config.footer}      ║
╚════════════════════════════════╝`

  const media =
    await prepareWAMessageMedia(
      {
        image: {
          url: imageUrl
        }
      },
      {
        upload:
          conn.waUploadToServer
      }
    )

  const msg =
    generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {

          message: {

            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },

            interactiveMessage: {

              body: {
                text:
                  textoMenu
              },

              footer: {
                text:
                  `丂卂丨ㄒ卄卂爪卂乃ㄖㄒ • ${new Date().getFullYear()}`
              },

              header: {

                hasMediaAttachment:
                  true,

                imageMessage:
                  media.imageMessage
              },

              nativeFlowMessage: {

                buttons: [

                  {
                    name:
                      'single_select',

                    buttonParamsJson:
                      JSON.stringify({

                        title:
                          '𝚂𝙴𝙻𝙴𝙲𝙲𝙸𝙾𝙽𝙰𝚁 𝙲𝙰𝚃𝙴𝙶𝙾𝚁Í𝙰𝚂',

                        sections: [

                          {
                            title:
                              '丂卂丨ㄒ卄卂爪卂乃ㄖㄒ',

                            rows
                          }

                        ]
                      })
                  },

                  {
                    name:
                      'cta_url',

                    buttonParamsJson:
                      JSON.stringify({

                        display_text:
                          '➤ 𝚂𝙴𝙶𝚄𝙸𝚁 𝙲𝙰𝙽𝙰𝙻',

                        url:
                          config.groupLink ||
                          'https://whatsapp.com',

                        merchant_url:
                          config.groupLink ||
                          'https://whatsapp.com'
                      })
                  }
                ]
              },

              contextInfo:
                getContextInfo(
                  conn,
                  m
                )
            }
          }
        }
      },
      {
        quoted: m
      }
    )

  await conn.relayMessage(
    m.chat,
    msg.message,
    {
      messageId:
        msg.key.id
    }
  )
}

handler.all = async (
  m,
  {
    conn,
    isOwner,
    usedPrefix,
    groupDb,
    userDb
  }
) => {

  if (
    m.responseId &&
    m.responseId.startsWith(
      'menu_cat_'
    )
  ) {

    const tag =
      m.responseId.replace(
        'menu_cat_',
        ''
      )

    return enviarSubmenu(
      conn,
      m,
      tag,
      isOwner,
      usedPrefix,
      groupDb,
      userDb
    )
  }
}

handler.help = [
  'menu'
]

handler.tags = [
  'info'
]

handler.command = [

  'menu',
  'help',
  'ayuda',
  'menú',

  ...Array.from(
    {
      length: 20
    },
    (_, i) =>
      `menu${i + 1}`
  )
]

export default handler 
