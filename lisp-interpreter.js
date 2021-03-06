const parsers = require('./factory-parser.js')
const parseEval = parsers.parseEval
const Env = parsers.environment

let readline = require('readline')
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

function evalLisp (s) {
  let resPL = parseEval(s, Env)
  if (resPL) return resPL[0] || resPL
  else return null
}

rl.on('line', function (line) {
  if (line.length !== 0) console.log(evalLisp(line))
})
