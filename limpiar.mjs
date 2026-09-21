import fs from 'fs'
let c = fs.readFileSync('zen.js', 'utf8')

// 1️⃣ BORRAR TODO lo que genera esos mensajes para siempre
const bloqueo = `
// 🔇 SILENCIO TOTAL — NO BORRAR
console.log = function(...a) {
  const s = a.join(' ')
  if (s.includes('Closing session') || s.includes('SessionEntry') || 
      s.includes('baseKey') || s.includes('Buffer') || 
      s.includes('pendingPreKey') || s.includes('registrationId')) return
  process.stdout.write(s + '\n')
}
console.debug = () => {}
console.trace = () => {}
console.info = () => {}
// 🔇 FIN SILENCIO
`

// Insertar justo después de los imports
if (!c.includes('SILENCIO TOTAL')) {
  c = c.replace(/^(import.*\n)+/, '$&' + bloqueo)
  fs.writeFileSync('zen.js', c)
  console.log('✅ BORRADO COMPLETO — Esos mensajes ya NO salen más')
} else {
  console.log('✅ Ya está limpio')
}
