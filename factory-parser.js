// exports.numParser = numberParser
// exports.expParser = expressionParser
let Environment = {
  'pi': 3.14,
  '+': (...vals) => vals.reduce((x, y) => x + y, 0),
  '-': (...vals) => vals.slice(1).reduce((x, y) => x - y, vals[0]),
  '*': (...vals) => vals.reduce((x, y) => x * y, 1),
  '/': (...vals) => vals.reduce((x, y) => x / y, 1),
  '>': (x, y) => x > y,
  '<': (x, y) => x < y,
  '>=': (x, y) => x >= y,
  '<=': (x, y) => x <= y,
  '===': (x, y) => x === y,
  '!==': (x, y) => x !== y,
  'abs': (x) => Math.abs(x),
  'append': (x, y) => x.concat(y),
  'apply': (func, args) => func(...args),
  'begin': (...args) => args[args.length - 1],
  'car': (x) => x[0],
  'cdr': (x) => x.slice(1),
  'cons': (x, y) => [x].concat(y),
  'eq?': (x, y) => x === y,
  'expt': (x, y) => Math.pow(x, y),
  'equal?': (x, y) => x === y,
  'length': (x) => x.length,
  'list': (...x) => x,
  'list?': (x) => Array.isArray(x),
  // 'map':
  // 'max':
  // 'min':
  'not': (x) => !(x),
  'null?': (x) => x === null,
  'number?': (x) => (typeof x) === 'number',
  'print': (x) => console.log(x[0]),
  // 'procedure?':
  'round': Math.round(),
  'symbol?': (x) => (typeof x) === 'string'
}

function isSigned (inp) {
  if (!(inp[0] === '-' || inp[0] === '+')) return null
  else return [inp[0], inp.slice(1)]
}

function isNegative (inp) {
  if (!(inp[0] === '-')) return null
  else return [inp[0], inp.slice(1)]
}

function isDigit (inp) {
  if (inp[0] === undefined) return null
  let codeC = inp[0].charCodeAt()
  if (!((codeC >= 48) && (codeC <= 57))) return null
  else return [inp[0], inp.slice(1)]
}

function isDecimalPoint (inp) {
  if (inp[0] === undefined) return null
  let codeC = inp[0]
  if (!(codeC === '.')) return null
  else return [codeC, inp.slice(1)]
}

function isExponential (inp) {
  if (!(inp[0] === 'E' || inp[0] === 'e')) return null
  else return [inp[0], inp.slice(1)]
}

function isZero (inp) {
  if (!(inp[0] === '0')) return null
  else return [inp[0], inp.slice(1)]
}

const returnsNull = (s) => null

// Transition Functions
const initFuncs = [isNegative, isZero, isDigit, returnsNull, returnsNull]
const afterSigned = [returnsNull, isZero, isDigit, returnsNull, returnsNull]
const afterZero = [returnsNull, returnsNull, returnsNull, isDecimalPoint, returnsNull]
const afterDigit = [returnsNull, returnsNull, isDigit, isDecimalPoint, isExponential]
const afterDecimalPoint = [returnsNull, returnsNull, isDigit, returnsNull, returnsNull]
const afterExponential = [isSigned, returnsNull, isDigit, returnsNull, returnsNull]
const afterFuncs = [afterSigned, afterZero, afterDigit, afterDecimalPoint, afterExponential]

function applyFuncs (arrF, inpS) {
  let ret = new Array(arrF.length).fill(null)
  let i = 0
  for (i; i < arrF.length; i++) {
    let F = arrF[i]
    let res = F(inpS)
    ret[i] = res
    if (res) return ret
  }
  if (i === arrF.length) return null
}

function pickFuncs (currState, loc) {
  if (loc === 0) return initFuncs

  for (let i = 0; i < currState.length; i++) {
    if (currState[i] !== null) return afterFuncs[i]
  }
  return null
}

function getResult (arrR) {
  for (let i = 0; i < arrR.length; i++) {
    if (arrR[i] != null) return arrR[i]
  }
  return null
}

function consumeSpaces (s) {
  while (s[0] === ' ' || s[0] === '\n' || s[0] === '\r' || s[0] === '\f') {
    s = s.slice(1)
  }
  return s
}

function numberParser (s) {
  let state = new Array(initFuncs.length).fill(null)
  let parsed = ''
  let ind = 0
  let remainingString = s.slice(ind)
  let expParsed = 0
  let signParsed = 0
  let startZeroesParsed = 0
  let decimalPointsParsed = 0

  // Handle single occurence of zero
  if (s[0] === '0') {
    let tempR = consumeSpaces(s.slice(1))
    if (tempR[0] === ',' || tempR[0] === '}' || tempR[0] === ']') return [s[0] * 1, tempR]
  }

  while (true) {
    // Pick transition functions based on state
    let transitionF = pickFuncs(state, ind)
    if (transitionF !== null) state = applyFuncs(transitionF, remainingString)
    else if (transitionF === null) return [parsed * 1, remainingString]
    // State after applying Functions
    if (state === null && ind !== 0) {
      if (isNaN(parsed * 1)) return null
      return [parsed * 1, remainingString]
    } else if (state === null && ind === 0) return null
    // using var here for code brevity
    var [v, rest] = getResult(state)
    if ((ind < 1) && (isZero(v) !== null)) {
      startZeroesParsed++
    }
    // Handle recurring "E/e"
    if (isExponential(remainingString)) expParsed++
    // Handle recurring "+/-"
    if (isSigned(remainingString)) signParsed++
    // Handle recurring "." and decimal after "E/e"
    if (isDecimalPoint(remainingString)) {
      if (expParsed > 0) decimalPointsParsed += 2
      else decimalPointsParsed++
    }
    // Handle starting zeroes
    if (startZeroesParsed > 0 && (decimalPointsParsed === 0)) {
      if (rest.length >= 1 && rest[0] !== '.') return null
    }
    // Check and return parsed string if there is unwanted "e/E/+/-/."
    if ((expParsed > 1) || (signParsed > 2) || (decimalPointsParsed > 1)) {
      if (isNaN(parsed * 1)) return null
    }
    // Check and return parsed string if "." occures after "e/E"
    if (expParsed > 1 && v === '.') return [parsed * 1, v + rest]
    parsed += v
    ind += 2
    remainingString = rest
    if (remainingString.length === 0 || remainingString === '0') {
      if (isNaN(parsed * 1)) return null
      return [parsed * 1, '']
    }
  }
}

function parseSymbol (s, set = 0) {
  let resSymbol = ''
  let remS = s
  while (true) {
    if (remS[0] === ' ' || remS[0] === ')' || remS[0] === ')') break
    if (remS.length === 0) return null
    resSymbol += remS[0]
    remS = remS.slice(1)
  }
  // if (resSymbol in Environment && set !== 1) resSymbol = Environment[resSymbol]
  if (resSymbol.length !== 0) return [resSymbol, remS]
  else return null
}

function extractExp (s) {
  if (s[0] !== '(') return null
  let exp = '('
  s = consumeSpaces(s.slice(1))
  while (true) {
    if (s[0] === ')') return [exp.concat(')'), s.slice(1)]
    if (s === '') return null
    if (s[0] === '(') {
      let eExp = extractExp(s)
      if (eExp === null) return null
      else if (eExp !== null) {
        exp += eExp[0]
        s = eExp[1]
      }
    } else {
      exp += s[0]
      s = s.slice(1)
    }
  }
}

function atomize (s) {
  var atoms = []
  let res = numberParser(s) || parseSymbol(s)
  s = s.slice(res[0].length).trimStart()
  atoms.push(res[0])
  while (res) {
    res = numberParser(s) || parseSymbol(s)
    if (res !== null) s = res[1].trimStart()
    else break
    atoms.push(res[0])
    console.log('===========from atomize()=========')
    console.log(res[1])
    if (res[1][0] === '(') {
      let res = extractExp(s)
      if (res !== null) {
        atoms.push(res[0])
        s = res[1]
      } else return null
    }
    if (res[1][0] !== ' ' || res[1][0] === ')') break
  }
  if (s[0] !== ')') return null
  if (atoms.length === null) return null
  console.log(atoms)
  return [atoms, s]
}

let procedure = function procedure (args, params, body, env) {
  let proc = Object.assign(Object.create(Environment), {
    params: [],
    body: '',
    localEnv: {}
  })
  return function procWithEnv (args) {
    
    return Object.assign(Object.create(proc), {

    })
  }
}

function parseEval (s) {
  let currVal = null
  if (!s.startsWith('(')) return null
  s = s.slice(1).trimStart()
  if (s[0] === '(') {
    let resPE = parseEval(s)
    if (resPE !== null) {
      currVal = resPE[0]
      s = resPE[1]
    }
  }
  if (s[0] === ')') return [currVal, s]
  let resA = atomize(s)
  if (resA === null) return null
  if (resA[0] in Environment) return Environment[resA[0]]
}
