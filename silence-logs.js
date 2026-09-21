import fs from 'fs'
let zen = fs.readFileSync('zen.js', 'utf8')

// Silenciar el logger dentro de makeCacheableSignalKeyStore
zen = zen.replace(
  /(keys: makeCacheableSignalKeyStore\([\s\S]*?state\.keys,\s*\n\s*)logger([\s\S]*?\))/,
  '$1pino({ level: "silent" })$2'
)

// Bloquear console.debug y console.trace para siempre
const bloqueo = `console.debug = () => {}
console.trace = () => {}
`
if (!zen.includes('console.debug = () => {}')) {
  zen = zen.replace(/^(import.*\n)+/, '$&' + bloqueo)
}

fs.writeFileSync('zen.js', zen)
console.log('✅ Listo — mensajes silenciados')
