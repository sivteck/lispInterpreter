exports.numParser = numberParser
exports.expParser = expressionParser

let Environment = {
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
  if (inp[0] === '-' || inp[0] === '+') {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isNegative (inp) {
  if (inp[0] === '-') {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isDigit (inp) {
  if (inp[0] === undefined) return null
  let codeC = inp[0].charCodeAt()
  if ((codeC >= 48) && (codeC <= 57)) {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isDecimalPoint (inp) {
  if (inp[0] === undefined) return null
  let codeC = inp[0]
  if (codeC === '.') {
    return [codeC, inp.slice(1)]
  } else return null
}

function isExponential (inp) {
  if (inp[0] === 'E' || inp[0] === 'e') {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isZero (inp) {
  if (inp[0] === '0') {
    return [inp[0], inp.slice(1)]
  }
  return null
}

function returnsNull (inp) {
  return null
}

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
    if (currState[i] !== null) {
      return afterFuncs[i]
    }
  }
  return null
}

function getResult (arrR) {
  for (let i = 0; i < arrR.length; i++) {
    if (arrR[i] != null) {
      return arrR[i]
    }
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
      if (expParsed > 0) {
        decimalPointsParsed += 2
      } else decimalPointsParsed++
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

function parseKeywords (s) {
  let keys = Object.keys(Environment)
  for (let i = 0; i < keys.length; i++) {
    if (s.startsWith(keys[i])) {
      return [Environment[keys[i]], s.slice(keys[i].length)]
    }
  }
  return null
}

function parseSymbol (s) {
  let resSymbol = ''
  let remS = s
  while (true) {
    if (remS[0] === ' ' || remS[0] === ')') break
    resSymbol += remS[0]
    remS = remS.slice(1)
  }
  if (resSymbol.length !== 0) return [resSymbol, remS]
  else return null
}

function expressionParser (s) {
  if (s[0] !== '(') return null
  let valList = []
  s = consumeSpaces(s.slice(1))
  if (s.startsWith('define')) {
    s = s.slice(6)
    updateEnv(6)
  } else {
    let respKW = parseKeywords(s)
    if (respKW === null) return null
    var func = respKW[0]
    s = respKW[1].slice(1)
    while (true) {
      s = consumeSpaces(s)
      if (s[0] === ')') return [func(...valList), s.slice(1)]
      if (s[0] === '(') {
        let resExp = expressionParser(s)
        if (resExp === null) return null
        else {
          valList.push(resExp[0])
          s = resExp[1]
        }
      }
      s = consumeSpaces(s)
      let resP = numOrSymParser(s)
      if (resP !== null) {
        if (resP[0] === 'define') {
          s = updateEnv(s)
          if (s === null) return null
        } else {
          valList.push(resP[0])
          s = resP[1]
        }
      }
    }
  }
}

function numOrSymParser (s) {
  return numberParser(s) || parseSymbol(s)
}

function updateEnv (s) {
  s = consumeSpaces(s)
  let resPS = parseSymbol(s)
  if (resPS !== null) {
    let [v, remS] = resPS
    let resNP = numberParser(consumeSpaces(remS))
    if (resNP !== null) {
      let [vn, remSn] = resNP
      Environment[v] = vn
      return remSn
    }
  }
  return null
}
