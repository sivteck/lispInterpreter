const parsers = require('./factory-parser.js')
const parseNum = parsers.numParser
const parseStr = parsers.stringParser
const parseExp = parsers.expParser

const repl = s => console.log(s)

let readline = require('readline')
let rl = readline.createInterface({ input: process.stdin,
  output: process.stdout,
  terminal: false })

function evalLisp (s) {
  let resPL = parseExp(s)
  if (resPL) return resPL[0]
  else return null
}

rl.on('line', function (line) {
  if (line.length !== 0) console.log(evalLisp(line))
})
