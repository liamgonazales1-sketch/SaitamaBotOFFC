import 'dotenv/config'
import * as baileysMod from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import { readdir, stat, unlink } from 'fs/promises'
import readline from 'readline'
import chalk from 'chalk'
import NodeCache from 'node-cache'

// SILENCIAR LOGS DE BAILEYS / LIBSIGNAL
const __log = console.log.bind(console)
const __info = console.info.bind(console)
const __warn = console.warn.bind(console)

const __isCryptoLog = (...args) => {
  const t = args.map(String).join(' ')

  return (
    t.includes('Closing session') ||
    t.includes('Decrypted message with closed session') ||
    t.includes('Removing old closed session') ||
    t.includes('SessionEntry') ||
    t.includes('baseKey') ||
    t.includes('Buffer') ||
    t.includes('pendingPreKey') ||
    t.includes('registrationId')
  )
}

console.log = (...args) => {
  if (__isCryptoLog(...args)) return
  __log(...args)
}

console.info = (...args) => {
  if (__isCryptoLog(...args)) return
  __info(...args)
}

console.warn = (...args) => {
  if (__isCryptoLog(...args)) return
  __warn(...args)
}

const __error = console.error.bind(console)

console.error = (...args) => {
  if (__isCryptoLog(...args)) return
  __error(...args)
}

console.debug = () => {}
console.trace = () => {}

import config from './config.js'
import { connectDB } from './lib/database/db.js'
import { handler, loadPlugins, setupWatchers, plugins } from './handler.js'
import { groupCache, msgRetryCache } from './lib/caches.js'
import { autoStartSubBots } from './lib/jadibot.js'
import GroupDb from './lib/database/models/zen-groups.js'
import { translateText } from './lib/lang.js'
import { moderarMensaje } from './lib/nsfw.js'

const pkg =
  baileysMod.default && Object.keys(baileysMod).length === 1
    ? baileysMod.default
    : baileysMod

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} = pkg

const SESSION_PATH = './sessions/main'
const TMP_PATH = './tmp'

if (!fs.existsSync(SESSION_PATH)) {
  fs.mkdirSync(SESSION_PATH, { recursive: true })
}

if (!fs.existsSync(TMP_PATH)) {
  fs.mkdirSync(TMP_PATH, { recursive: true })
}

/* =========================================================
   LIMPIEZA DE ARCHIVOS TEMPORALES
========================================================= */

setInterval(async () => {
  if (!fs.existsSync(TMP_PATH)) return

  try {
    const files = await readdir(TMP_PATH)

    for (const file of files) {
      const filePath = `${TMP_PATH}/${file}`

      try {
        const stats = await stat(filePath)

        if (Date.now() - stats.mtimeMs > 3600000) {
          await unlink(filePath)
        }
      } catch {}
    }
  } catch {}
}, 3600000)

/* =========================================================
   RECONEXIÓN
========================================================= */

let retryCount = 0

function calcDelay() {
  return Math.min(
    5000 * 2 ** retryCount + Math.random() * 2000,
    120000
  )
}

/* =========================================================
   CACHE
========================================================= */

const msgRetryCounterCache = new NodeCache({
  stdTTL: 180,
  checkperiod: 30
})

/* =========================================================
   INICIAR BOT
========================================================= */

async function startBot() {
  await connectDB()

  const { state, saveCreds } =
    await useMultiFileAuthState(SESSION_PATH)

  const { version } =
    await fetchLatestBaileysVersion()

  const logger = pino({
    level: 'silent'
  })

  /* =======================================================
     LIMPIAR SESIÓN INCOMPLETA
  ======================================================= */

  if (!state.creds.registered) {
    const sessionFiles = fs
      .readdirSync(SESSION_PATH)
      .filter(file => file !== 'creds.json')

    if (sessionFiles.length > 0) {
      console.log(
        chalk.bold.yellowBright(
          '⚠️ Sesión previa incompleta detectada. Limpiando caché...'
        )
      )

      for (const file of sessionFiles) {
        try {
          fs.unlinkSync(
            `${SESSION_PATH}/${file}`
          )
        } catch {}
      }
    }
  }

  /* =======================================================
     SOCKET
  ======================================================= */

  const conn = makeWASocket({
    version,
    logger,

    printQRInTerminal:
      !config.usePairingCode,

    browser: Browsers.ubuntu('Chrome'),

    keepAliveIntervalMs: 60000,
    connectTimeoutMs: 60000,

    msgRetryCounterCache,

    auth: {
      creds: state.creds,

      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: "silent" })
      )
    },

    markOnlineOnConnect: false,

    generateHighQualityLinkPreview: false,

    syncFullHistory: false,
    forceSyncHistoryMessage: false,

    shouldSyncHistoryMessage: () => false,

    getMessage: async key => {
      const msg =
        msgRetryCache.get(key.id)

      return msg || undefined
    }
  })

  /* =======================================================
     TRADUCCIÓN GLOBAL DE MENSAJES
  ======================================================= */

  const _sendMessage =
    conn.sendMessage.bind(conn)

  conn.sendMessage = async (
    jid,
    content = {},
    options = {}
  ) => {
    try {
      if (content?.text) {
        content.text =
          await translateText(
            conn,
            content.text
          )
      }

      if (content?.caption) {
        content.caption =
          await translateText(
            conn,
            content.caption
          )
      }

      if (content?.footer) {
        content.footer =
          await translateText(
            conn,
            content.footer
          )
      }

      if (content?.title) {
        content.title =
          await translateText(
            conn,
            content.title
          )
      }
    } catch {}

    return _sendMessage(
      jid,
      content,
      options
    )
  }

  /* =======================================================
     PAIRING CODE
  ======================================================= */

  if (
    config.usePairingCode &&
    !conn.authState.creds.registered
  ) {
    let numero =
      config.phoneNumber?.replace(
        /\D/g,
        ''
      )

    if (!numero) {
      const rl =
        readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })

      numero = await new Promise(resolve => {
        rl.question(
          chalk.bold.yellowBright(
            '\nINGRESA TU NÚMERO DE TELÉFONO (sin +): '
          ),
          answer => {
            rl.close()
            resolve(
              answer.replace(/\D/g, '')
            )
          }
        )
      })
    }

    setTimeout(async () => {
      try {
        const raw =
          await conn.requestPairingCode(
            numero
          )

        const code =
          raw
            ?.match(/.{1,4}/g)
            ?.join('-') ?? raw

        console.log(
          `\n${chalk.bold.yellowBright(
            'CÓDIGO:'
          )} ${chalk.bold.bgGreen.white(
            ` ${code} `
          )}\n`
        )
      } catch (e) {
        console.error(
          chalk.bold.bgRed.white(
            ' [PAIRING ERROR] '
          ),
          chalk.bold.redBright(
            e?.message || e
          )
        )

        process.exit(1)
      }
    }, 3000)
  }

  /* =======================================================
     CREDENCIALES
  ======================================================= */

  conn.ev.on(
    'creds.update',
    saveCreds
  )

  /* =======================================================
     CONEXIÓN
  ======================================================= */

  conn.ev.on(
    'connection.update',
    async ({
      connection,
      lastDisconnect
    }) => {

      if (connection === 'close') {
        const code =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode

        /* SESIÓN CERRADA */

        if (
          code ===
            DisconnectReason.loggedOut ||
          code === 401
        ) {
          conn.ev.removeAllListeners()

          try {
            conn.ws.close()
          } catch {}

          setTimeout(() => {
            fs.rmSync(
              SESSION_PATH,
              {
                recursive: true,
                force: true
              }
            )

            fs.mkdirSync(
              SESSION_PATH,
              {
                recursive: true
              }
            )

            retryCount = 0

            startBot()
          }, 2000)

          return
        }

        /* DEMASIADOS ERRORES */

        if (
          code === 405 ||
          code === 429 ||
          retryCount >= 10
        ) {
          conn.ev.removeAllListeners()

          try {
            conn.ws.close()
          } catch {}

          return process.exit(1)
        }

        /* RECONEXIÓN RÁPIDA */

        if (
          code === 408 ||
          code === 503
        ) {
          conn.ev.removeAllListeners()

          try {
            conn.ws.close()
          } catch {}

          return setTimeout(
            startBot,
            2000
          )
        }

        retryCount++

        const delay =
          calcDelay()

        console.log(
          chalk.bold.yellowBright(
            `↻ RECONEXIÓN EN ${Math.round(
              delay / 1000
            )}s...`
          )
        )

        conn.ev.removeAllListeners()

        try {
          conn.ws.close()
        } catch {}

        setTimeout(
          startBot,
          delay
        )
      }

      /* BOT CONECTADO */

      if (connection === 'open') {
        retryCount = 0

        console.log(
          chalk.bold.bgGreen.white(
            '\n ✅ BOT CONECTADO Y LISTO! \n'
          )
        )

        const groups =
          await conn
            .groupFetchAllParticipating()
            .catch(() => ({}))

        for (const id in groups) {
          groupCache.set(
            id,
            groups[id]
          )
        }

        await loadPlugins()

        await autoStartSubBots(
          conn
        )

        if (
          process.env.NODE_ENV ===
          'development'
        ) {
          setupWatchers()
        }
      }
    }
  )


  /* =======================================================
   MENSAJES + ANTI-NSFW
======================================================= */

conn.ev.on(
  'messages.upsert',
  async ({ messages, type }) => {

    if (type !== 'notify') return

    for (const m of messages) {
      try {

        if (m.message) {
          msgRetryCache.set(
            m.key.id,
            m.message
          )
        }

        if (
          !m?.message ||
          m.key.remoteJid === 'status@broadcast'
        ) {
          continue
        }

        const jid = m.key.remoteJid

        /* ===============================================
           🚫 ANTI-NSFW
        =============================================== */

        if (jid?.endsWith('@g.us')) {

          const groupDb =
            await GroupDb.findOne({
              jid
            }).catch(() => null)

          if (groupDb?.antiPorno) {

            await moderarMensaje(
              conn,
              m,
              groupDb
            )
          }
        }

        /* ===============================================
           🤖 HANDLER
        =============================================== */

        await handler(
          conn,
          m
        ).catch(() => {})

      } catch {}
    }
  }
)

  /* =======================================================
     ACTUALIZACIÓN DE PARTICIPANTES
  ======================================================= */

  conn.ev.on(
    'group-participants.update',
    async update => {

      try {
        const {
          id,
          action
        } = update

        if (id) {
          groupCache.del(id)

          conn
            .groupMetadata(id)
            .then(meta => {
              if (meta?.id) {
                groupCache.set(
                  id,
                  meta
                )
              }
            })
            .catch(() => {})
        }

        const welcomePlugin =
          plugins['welcome.js']

        if (
          welcomePlugin
            ?.manejarParticipantes
        ) {
          await welcomePlugin
            .manejarParticipantes(
              conn,
              update
            )
        }

      } catch {}
    }
  )

  /* =======================================================
     ANTILLAMADAS
  ======================================================= */

  conn.ev.on(
    'call',
    async calls => {

      try {

        if (!Array.isArray(calls))
          return

        for (const call of calls) {

          if (!call) continue

          /* SOLO LLAMADAS ENTRANTES */

          if (
            call.status !== 'offer'
          ) {
            continue
          }

          /* RECHAZAR LLAMADA */

          await conn
            .rejectCall(
              call.id,
              call.from
            )
            .catch(() => {})

          /* OBTENER GRUPO */

          const groupId =
            call.groupJid ||
            call.groupId ||
            call.from

          if (
            !groupId ||
            !groupId.endsWith('@g.us')
          ) {
            continue
          }

          /* OBTENER USUARIO */

          const caller =
            call.callerPn ||
            call.caller ||
            call.from

          if (!caller) continue

          let user = caller

          if (
            !user.includes('@')
          ) {
            user =
              `${user}@s.whatsapp.net`
          }

          /* CONFIGURACIÓN DEL GRUPO */

          const groupDb =
            await GroupDb.findOne({
              jid: groupId
            }).catch(
              () => null
            )

          if (
            !groupDb?.antiCall
          ) {
            continue
          }

          /* METADATA */

          const metadata =
            await conn
              .groupMetadata(
                groupId
              )
              .catch(
                () => null
              )

          if (!metadata)
            continue

          /* JID DEL BOT */

          const botNumber =
            conn.user?.id
              ?.split(':')[0]

          const botJid =
            botNumber
              ? `${botNumber}@s.whatsapp.net`
              : null

          /* VERIFICAR ADMIN */

          const botParticipant =
            metadata.participants.find(
              p =>
                p.id ===
                  conn.user?.id ||
                p.id === botJid ||
                p.jid ===
                  conn.user?.id ||
                p.jid === botJid
            )

          const botIsAdmin =
            botParticipant?.admin ===
              'admin' ||
            botParticipant?.admin ===
              'superadmin' ||
            botParticipant?.admin ===
              true

          if (!botIsAdmin)
            continue

          /* BUSCAR USUARIO */

          const participant =
            metadata.participants.find(
              p =>
                p.id === user ||
                p.jid === user
            )

          if (!participant)
            continue

          /* NO EXPULSAR ADMINS */

          if (
            participant.admin ===
              'admin' ||
            participant.admin ===
              'superadmin' ||
            participant.admin ===
              true
          ) {
            continue
          }

          /* OWNER */

          const owner =
            String(
              config.ownerNumber || ''
            ).replace(
              /\D/g,
              ''
            )

          const callerNumber =
            user
              .split('@')[0]
              .split(':')[0]
              .replace(
                /\D/g,
                ''
              )

          if (
            owner &&
            callerNumber === owner
          ) {
            continue
          }

          /* EXPULSAR */

          await conn
            .groupParticipantsUpdate(
              groupId,
              [user],
              'remove'
            )
            .catch(() => {})

          /* AVISO */

          await conn
            .sendMessage(
              groupId,
              {
                text:
`╭━━━〔 📞 ANTILLAMADAS 〕━━━⬣

🚫 @${callerNumber} fue expulsado automáticamente.

📞 Motivo:
Realizó una llamada al grupo.

╰━━━━━━━━━━━━━━━━━━⬣`,
                mentions: [user]
              }
            )
            .catch(() => {})
        }

      } catch {}
    }
  )
}

/* =========================================================
   APAGADO
========================================================= */

const shutdown = () =>
  process.exit(0)

process.on(
  'SIGINT',
  shutdown
)

process.on(
  'SIGTERM',
  shutdown
)

process.on(
  'unhandledRejection',
  () => {}
)

process.on(
  'uncaughtException',
  () => {}
)

/* =========================================================
   INICIAR
========================================================= */

startBot()