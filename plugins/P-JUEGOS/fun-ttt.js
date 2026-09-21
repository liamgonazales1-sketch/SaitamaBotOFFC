import User from '../../lib/database/models/zen-users.js'
import config from '../../config.js'

const partidas = new Map()

const VACIO = [' ',' ',' ',' ',' ',' ',' ',' ',' ']
const POS = {1:0,2:1,3:2,4:3,5:4,6:5,7:6,8:7,9:8}
const COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
]
const NUM = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣']

const DIF = {
  facil: {
    premio: 0,
    texto: 'La IA comete errores frecuentes'
  },
  medio: {
    premio: 0,
    texto: 'La IA juega de forma equilibrada'
  },
  dificil: {
    premio: 2500,
    texto: 'La IA es muy difícil de vencer'
  },
  imposible: {
    premio: 10000,
    texto: 'La IA juega perfectamente'
  }
}

const ALIAS = {
  facil: 'facil',
  easy: 'facil',
  medio: 'medio',
  medium: 'medio',
  dificil: 'dificil',
  hard: 'dificil',
  imposible: 'imposible',
  impossible: 'imposible'
}

const nombre = jid => jid?.split('@')[0] || 'Usuario'

function tablero(t) {
  return [
    `┌─────┬─────┬─────┐`,
    `│ ${t[0] === ' ' ? NUM[0] : t[0]} │ ${t[1] === ' ' ? NUM[1] : t[1]} │ ${t[2] === ' ' ? NUM[2] : t[2]} │`,
    `├─────┼─────┼─────┤`,
    `│ ${t[3] === ' ' ? NUM[3] : t[3]} │ ${t[4] === ' ' ? NUM[4] : t[4]} │ ${t[5] === ' ' ? NUM[5] : t[5]} │`,
    `├─────┼─────┼─────┤`,
    `│ ${t[6] === ' ' ? NUM[6] : t[6]} │ ${t[7] === ' ' ? NUM[7] : t[7]} │ ${t[8] === ' ' ? NUM[8] : t[8]} │`,
    `└─────┴─────┴─────┘`
  ].join('\n')
}

function ganador(t) {
  for (const [a,b,c] of COMBOS)
    if (t[a] !== ' ' && t[a] === t[b] && t[b] === t[c])
      return t[a]
  return null
}

const lleno = t => t.every(x => x !== ' ')

function ganarEn(t, ficha) {
  for (const i of t.map((x,i) => x === ' ' ? i : -1).filter(i => i >= 0)) {
    const copia = [...t]
    copia[i] = ficha
    if (ganador(copia) === ficha) return i
  }
  return -1
}

function minimax(t, ia) {
  const g = ganador(t)
  if (g === '⭕') return 10
  if (g === '✖') return -10
  if (lleno(t)) return 0

  const libres = t.map((x,i) => x === ' ' ? i : -1).filter(i => i >= 0)

  if (ia) {
    let mejor = -Infinity
    for (const i of libres) {
      const c = [...t]
      c[i] = '⭕'
      mejor = Math.max(mejor, minimax(c, false))
    }
    return mejor
  }

  let mejor = Infinity
  for (const i of libres) {
    const c = [...t]
    c[i] = '✖'
    mejor = Math.min(mejor, minimax(c, true))
  }
  return mejor
}

function movimientoIA(t, dificultad) {
  const libres = t.map((x,i) => x === ' ' ? i : -1).filter(i => i >= 0)
  if (!libres.length) return -1

  const random = () => libres[Math.floor(Math.random() * libres.length)]

  if (dificultad === 'facil')
    return Math.random() < .75 ? random() : ganarEn(t, '✖') >= 0 ? ganarEn(t, '✖') : random()

  const ganar = ganarEn(t, '⭕')
  if (ganar >= 0) return ganar

  const bloquear = ganarEn(t, '✖')

  if (dificultad === 'medio')
    return bloquear >= 0 && Math.random() < .6 ? bloquear : random()

  if (dificultad === 'dificil') {
    if (bloquear >= 0) return bloquear
    if (t[4] === ' ') return 4
    return random()
  }

  let mejor = -Infinity
  let posicion = libres[0]

  for (const i of libres) {
    const c = [...t]
    c[i] = '⭕'
    const valor = minimax(c, false)

    if (valor > mejor) {
      mejor = valor
      posicion = i
    }
  }

  return posicion
}

async function stat(jid, campo) {
  await User.updateOne({ jid }, { $inc: { [campo]: 1 } })
}

const handler = async (m, ctx) => {
  const { conn, command, args } = ctx
  const chat = m.chat
  const sender = m.sender
  const S = config.CURRENCY_SYMBOL

  if (command === 'ttt' || command === 'tictactoe') {

    if (partidas.has(chat))
      return m.reply(
        
        `✰ 𝚈𝚊 𝚑𝚊𝚢 𝚞𝚗𝚊 𝚙𝚊𝚛𝚝𝚒𝚍𝚊 𝚊𝚌𝚝𝚒𝚟𝚊\n\n` +
        `${tablero(partidas.get(chat).tablero)}`
      )

    const tipo = (args[0] || '').toLowerCase()

    if (!tipo)
      return m.reply(
        
        `✰ 𝚃𝙸𝙲 𝚃𝙰𝙲 𝚃𝙾𝙴\n\n` +
        `✰ 𝚄𝚜𝚊\n` +
        `> !ttt ia facil\n` +
        `> !ttt ia medio\n` +
        `> !ttt ia dificil\n` +
        `> !ttt ia imposible\n` +
        `> !ttt @usuario\n\n` +
        `✰ 𝙳𝚒𝚏𝚒𝚌𝚞𝚕𝚝𝚊𝚍𝚎𝚜\n` +
        `> 🟢 Facil\n` +
        `> 🟡 Medio\n` +
        `> 🔴 Dificil — +2,500 ${S}\n` +
        `> ⚫ Imposible — +10,000 ${S}`
      )

    if (['ia','ai','bot'].includes(tipo)) {
      const dificultad = ALIAS[(args[1] || '').toLowerCase()]

      if (!dificultad)
        return m.reply(
          
          `✰ 𝙳𝚒𝚏𝚒𝚌𝚞𝚕𝚝𝚊𝚍 𝚒𝚗𝚟𝚊𝚕𝚒𝚍𝚊\n\n` +
          `✰ 𝚄𝚜𝚊\n` +
          `> !ttt ia facil\n` +
          `> !ttt ia medio\n` +
          `> !ttt ia dificil\n` +
          `> !ttt ia imposible`
        )

      partidas.set(chat, {
        tablero: [...VACIO],
        jugador1: sender,
        jugador2: null,
        turno: sender,
        vsIA: true,
        dificultad,
        fichaJ1: '✖',
        fichaIA: '⭕',
        movs: 0
      })

      const d = DIF[dificultad]

      return m.reply(
        
        `✰ 𝚃𝚃𝚃 𝚅𝚂 𝙸𝙰\n\n` +
        `✰ 𝙳𝚒𝚏𝚒𝚌𝚞𝚕𝚝𝚊𝚍: *${dificultad.toUpperCase()}*\n` +
        `✰ ${d.texto}\n` +
        (d.premio ? `✰ 𝙿𝚛𝚎𝚖𝚒𝚘: *+${d.premio.toLocaleString()} ${S}*\n\n` : '\n') +
        `✰ 𝚄𝚜𝚊\n` +
        `> Envía un número del *1 al 9*\n\n` +
        tablero(VACIO)
      )
    }

    const rival = m.mentionedJid?.[0] ||
      (m.quoted?.sender && m.quoted.sender !== sender ? m.quoted.sender : null)

    if (!rival || rival === sender)
      return m.reply(
        
        `✰ 𝙳𝚎𝚗𝚐𝚊 𝚊 𝚞𝚗 𝚛𝚒𝚟𝚊𝚕\n\n` +
        `✰ 𝚄𝚜𝚊\n` +
        `> !ttt @usuario`
      )

    partidas.set(chat, {
      tablero: [...VACIO],
      jugador1: sender,
      jugador2: rival,
      turno: sender,
      vsIA: false,
      esperando: true,
      fichaJ1: '✖',
      fichaJ2: '⭕',
      movs: 0
    })

    return conn.sendMessage(chat, {
      text:
        
        `✰ 𝚁𝚎𝚝𝚘 𝚃𝚒𝚌 𝚃𝚊𝚌 𝚃𝚘𝚎\n\n` +
        `✰ @${nombre(sender)} *✖* retó a @${nombre(rival)} *⭕*\n\n` +
        `✰ 𝚄𝚜𝚊\n` +
        `> !aceptar\n` +
        `> !rechazar`,
      mentions: [sender, rival]
    }, { quoted: m })
  }

  if (['aceptar','accept'].includes(command)) {
    const p = partidas.get(chat)

    if (!p || !p.esperando)
      return m.reply(`✰ 𝙽𝚘 𝚑𝚊𝚢 𝚛𝚎𝚝𝚘𝚜 𝚙𝚎𝚗𝚍𝚒𝚎𝚗𝚝𝚎𝚜`)

    if (p.jugador2 !== sender)
      return m.reply(`✰ 𝙴𝚜𝚝𝚎 𝚛𝚎𝚝𝚘 𝚗𝚘 𝚎𝚜 𝚙𝚊𝚛𝚊 𝚟𝚘𝚜`)

    p.esperando = false
    partidas.set(chat, p)

    return conn.sendMessage(chat, {
      text:
        
        `✰ 𝙿𝚊𝚛𝚝𝚒𝚍𝚊 𝚒𝚗𝚒𝚌𝚒𝚊𝚍𝚊\n\n` +
        `✰ @${nombre(p.jugador1)} *✖* vs @${nombre(sender)} *⭕*\n\n` +
        `✰ 𝚃𝚞𝚛𝚗𝚘 𝚍𝚎 @${nombre(p.jugador1)}\n` +
        `✰ 𝚄𝚜𝚊 𝚞𝚗 𝚗ú𝚖𝚎𝚛𝚘 𝚍𝚎𝚕 *1 𝚊𝚕 9*\n\n` +
        tablero(p.tablero),
      mentions: [p.jugador1, sender]
    }, { quoted: m })
  }

  if (['rechazar','decline'].includes(command)) {
    const p = partidas.get(chat)

    if (!p || !p.esperando || p.jugador2 !== sender)
      return m.reply(`✰ 𝙽𝚘 𝚝𝚒𝚎𝚗𝚎𝚜 𝚞𝚗 𝚛𝚎𝚝𝚘`)

    partidas.delete(chat)

    return conn.sendMessage(chat, {
      text:
        
        `✰ 𝚁𝚎𝚝𝚘 𝚛𝚎𝚌𝚑𝚊𝚣𝚊𝚍𝚘\n` +
        `✰ @${nombre(sender)} rechazó la partida`,
      mentions: [sender, p.jugador1]
    }, { quoted: m })
  }

  if (['rendirse','surrender','desistir'].includes(command)) {
    const p = partidas.get(chat)

    if (!p)
      return m.reply(`✰ 𝙽𝚘 𝚑𝚊𝚢 𝚙𝚊𝚛𝚝𝚒𝚍𝚊`)

    if (![p.jugador1, p.jugador2].includes(sender))
      return m.reply(`✰ 𝙽𝚘 𝚙𝚊𝚛𝚝𝚒𝚌𝚒𝚙𝚊𝚜 𝚎𝚗 𝚎𝚜𝚝𝚊 𝚙𝚊𝚛𝚝𝚒𝚍𝚊`)

    const rival = p.vsIA ? null :
      sender === p.jugador1 ? p.jugador2 : p.jugador1

    partidas.delete(chat)

    if (rival) await stat(rival, 'tttWins')
    await stat(sender, 'tttLosses')

    return conn.sendMessage(chat, {
      text:
        
        `✰ 𝚁𝚎𝚗𝚍𝚒𝚌𝚒ó𝚗\n\n` +
        `✰ @${nombre(sender)} abandonó la partida` +
        (rival ? `\n✰ Victoria para @${nombre(rival)}` : ''),
      mentions: [sender, rival].filter(Boolean)
    }, { quoted: m })
  }

  if (command === 'tttstats') {
    const jid = m.mentionedJid?.[0] || sender
    const u = await User.findOne({ jid }).lean()

    const wins = u?.tttWins || 0
    const losses = u?.tttLosses || 0
    const draws = u?.tttDraws || 0
    const total = wins + losses + draws
    const rate = total ? ((wins / total) * 100).toFixed(1) : '0.0'

    return conn.sendMessage(chat, {
      text:
        
        `✰ 𝚂𝚝𝚊𝚝𝚜 𝚃𝚃𝚃 — @${nombre(jid)}\n\n` +
        `✰ 𝚅𝚒𝚌𝚝𝚘𝚛𝚒𝚊𝚜: *${wins}*\n` +
        `✰ 𝙳𝚎𝚛𝚛𝚘𝚝𝚊𝚜: *${losses}*\n` +
        `✰ 𝙴𝚖𝚙𝚊𝚝𝚎𝚜: *${draws}*\n` +
        `✰ 𝚆𝚒𝚗 𝚛𝚊𝚝𝚎: *${rate}%*`,
      mentions: [jid]
    }, { quoted: m })
  }

  if (command === 'tttranking' || command === 'tttrank') {
    const users = await User.find(
      { $or: [{tttWins: {$gt: 0}}, {tttLosses: {$gt: 0}}] },
      { jid:1, name:1, tttWins:1, tttLosses:1, tttDraws:1 }
    ).sort({tttWins:-1}).limit(10).lean()

    if (!users.length)
      return m.reply(`✰ 𝙽𝚊𝚍𝚒𝚎 𝚑𝚊 𝚓𝚞𝚐𝚊𝚍𝚘 𝚊ú𝚗`)

    const medallas = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']

    const lista = users.map((u,i) =>
      `${medallas[i]} *${u.name || nombre(u.jid)}* — 🏆${u.tttWins || 0} ❌${u.tttLosses || 0} 🤝${u.tttDraws || 0}`
    ).join('\n')

    return conn.sendMessage(chat, {
      text:
        
        `✰ 𝚁𝚊𝚗𝚔𝚒𝚗𝚐 𝚃𝚃𝚃\n\n${lista}`,
      mentions: users.map(u => u.jid)
    }, { quoted: m })
  }
}

handler.all = async (m, ctx) => {
  const { conn } = ctx
  const chat = m.chat
  const sender = m.sender

  const p = partidas.get(chat)
  if (!p || p.esperando) return

  const body = (m.body || '').trim()
  if (!/^[1-9]$/.test(body)) return

  if (![p.jugador1, p.jugador2].includes(sender)) return

  if (p.turno !== sender)
    return m.reply(`✰ 𝙽𝚘 𝚎𝚜 𝚝𝚞 𝚝𝚞𝚛𝚗𝚘`)

  const pos = POS[body]

  if (p.tablero[pos] !== ' ')
    return m.reply(`✰ 𝙲𝚊𝚜𝚒𝚕𝚕𝚊 𝚘𝚌𝚞𝚙𝚊𝚍𝚊`)

  p.tablero[pos] = p.vsIA || sender === p.jugador1 ? '✖' : '⭕'
  p.movs++

  let win = ganador(p.tablero)

  if (win) {
    partidas.delete(chat)

    await stat(sender, 'tttWins')

    if (p.vsIA && DIF[p.dificultad]?.premio)
      await User.updateOne(
        { jid: sender },
        { $inc: { genosCoins: DIF[p.dificultad].premio } }
      )

    if (!p.vsIA)
      await stat(sender === p.jugador1 ? p.jugador2 : p.jugador1, 'tttLosses')

    const S = config.CURRENCY_SYMBOL
    const premio = p.vsIA ? DIF[p.dificultad].premio : 0

    return conn.sendMessage(chat, {
      text:
        
        `✰ 𝙶𝚊𝚗𝚊𝚜𝚝𝚎\n\n` +
        `✰ @${nombre(sender)} ganó con *${win}*\n` +
        (premio ? `✰ 𝙿𝚛𝚎𝚖𝚒𝚘: *+${premio.toLocaleString()} ${S}*\n\n` : '\n') +
        tablero(p.tablero),
      mentions: [sender]
    }, { quoted: m })
  }

  if (lleno(p.tablero)) {
    partidas.delete(chat)
    await stat(sender, 'tttDraws')

    return conn.sendMessage(chat, {
      text:
        
        `✰ 𝙴𝚖𝚙𝚊𝚝𝚎\n\n` +
        tablero(p.tablero),
      mentions: [sender]
    }, { quoted: m })
  }

  if (p.vsIA) {
    const ia = movimientoIA(p.tablero, p.dificultad)

    p.tablero[ia] = '⭕'
    p.movs++

    win = ganador(p.tablero)

    if (win) {
      partidas.delete(chat)
      await stat(sender, 'tttLosses')

      return conn.sendMessage(chat, {
        text:
          
          `✰ 𝙻𝚊 𝙸𝙰 𝚐𝚊𝚗ó\n\n` +
          `✰ Jugada: *${ia + 1}*\n\n` +
          tablero(p.tablero),
        mentions: [sender]
      }, { quoted: m })
    }

    if (lleno(p.tablero)) {
      partidas.delete(chat)
      await stat(sender, 'tttDraws')

      return conn.sendMessage(chat, {
        text:
          
          `✰ 𝙴𝚖𝚙𝚊𝚝𝚎\n\n` +
          tablero(p.tablero),
        mentions: [sender]
      }, { quoted: m })
    }

    partidas.set(chat, p)

    return conn.sendMessage(chat, {
      text:
        
        `✰ 𝙻𝚊 𝙸𝙰 𝚓𝚞𝚐ó 𝚎𝚗 *${ia + 1}*\n\n` +
        tablero(p.tablero) +
        `\n\n✰ 𝚃𝚞 𝚝𝚞𝚛𝚗𝚘 — 𝚎𝚗𝚟í𝚊 𝚞𝚗 𝚗ú𝚖𝚎𝚛𝚘 𝚍𝚎𝚕 *1 𝚊𝚕 9*`,
      mentions: [sender]
    }, { quoted: m })
  }

  p.turno = sender === p.jugador1 ? p.jugador2 : p.jugador1
  partidas.set(chat, p)

  return conn.sendMessage(chat, {
    text:
      
      `✰ 𝚃𝚞𝚛𝚗𝚘 𝚍𝚎 @${nombre(p.turno)}\n\n` +
      tablero(p.tablero) +
      `\n\n✰ 𝙴𝚗𝚟í𝚊 𝚞𝚗 𝚗ú𝚖𝚎𝚛𝚘 𝚍𝚎𝚕 *1 𝚊𝚕 9*`,
    mentions: [p.turno]
  }, { quoted: m })
}

handler.help = [
  'ttt',
  'ttt ia <dificultad>',
  'ttt @usuario'
]

handler.tags = ['fun']

handler.command = [
  'ttt',
  'tictactoe',
  'aceptar',
  'accept',
  'rechazar',
  'decline',
  'rendirse',
  'surrender',
  'desistir',
  'tttstats',
  'tttranking',
  'tttranking'
]

export default handler
