let readline = require('readline')
let rl = readline.createInterface({ input: process.stdin,
  output: process.stdout,
  terminal: false })

rl.on('line', function (line) {
  if (line.length !== 0) repl(line)
})

const repl = s => console.log(s)
