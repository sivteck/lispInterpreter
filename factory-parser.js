// exports.numParser = numberParser
// exports.expParser = expressionParser

const env = {}

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
  'symbol?': (x) => (typeof x) === 'string',
  'innerEnv': env
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

function parseKeywords (s) {
  let keys = Object.keys(Environment)
  for (let i = 0; i < keys.length; i++) {
    if (s.startsWith(keys[i])) {
      return [Environment[keys[i]], s.slice(keys[i].length)]
    }
  }
  return null
}

function parseSymbol (s, set) {
  let resSymbol = ''
  let remS = s
  while (true) {
    if (remS[0] === ' ' || remS[0] === ')' || remS[0] === ')') break
    resSymbol += remS[0]
    remS = remS.slice(1)
  }
  if (resSymbol in Environment && set !== 1) resSymbol = Environment[resSymbol]
  if (resSymbol.length !== 0) return [resSymbol, remS]
  else return null
}

function expressionParser (s) {
  if (s[0] !== '(') return null
  let valList = []
  s = consumeSpaces(s.slice(1))
  if (s.startsWith('define')) s = updateEnv(s.slice(6), 0)
  else {
    let respKW = parseKeywords(s)
    if (respKW === null) return null
    let func = respKW[0]
    s = respKW[1]
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
          s = updateEnv(s, 0)
          if (s === null) return null
        } else {
          valList.push(resP[0])
          s = resP[1]
        }
      }
    }
  }
  s = s.slice(1)
}

function numOrSymParser (s) {
  return numberParser(s) || parseSymbol(s)
}

function updateEnv (s, set) {
  s = consumeSpaces(s)
  let resPS = parseSymbol(s, set)
  console.log('============From updateEnv resPS==========')
  console.log(resPS)
  if (resPS !== null) {
    let [v, remS] = resPS
    if (set === 1) if (!(v in Environment)) return null
    let resNP = numberParser(consumeSpaces(remS))
    console.log('------------From updateEnv resNP----------')
    console.log(resNP)
    if (resNP !== null) {
      let [vn, remSn] = resNP
      Environment[v] = vn
      return remSn
    } else {
      let proc = extractExp(consumeSpaces(remS))
      console.log('-----------From updateEnv proc---------')
      console.log(proc)
      if (proc === null) return null
      Environment[v] = proc[0]
      return [[], proc[1]]
    }
  }
  return null
}

let evalOps = [defineOp, ifOp, quoteOp, setOp]

// TODO: integrate all ops/exps
function evalExp (s) {
  if (s[0] !== '(') return null
  else s = s.slice(1)
  let result = []
  if (s[0] === ')') return [result, s.slice(1)]
  s = defineOp(s)
  console.log('================From evalExp=============')
  console.log(s)
}

function defineOp (s) {
  if (!(s.startsWith('define'))) return null
  s = s.slice(6)
  console.log('---------------From defineOp()------------------')
  console.log(s)
  s = updateEnv(s)
  if (s !== null) return [[], s]
  else return s
}

function ifOp (s) {
  if (!(s.startsWith('if'))) return null
  s = consumeSpaces(s.slice(2))
  let evalCondition = expressionParser(s)
  if (evalCondition !== null) {
    let [v, remS] = evalCondition
    remS = consumeSpaces(remS)
    let evalSucc = expressionParser(remS)
    if (v) {
      let [_, remS2] = expressionParser(consumeSpaces(evalSucc[1]))
      return [evalSucc[0], remS2]
    } else return expressionParser(consumeSpaces(evalSucc[1]))
  } else return null
}

function quoteOp (s) {
  if (!(s.startsWith('quote'))) return null
  s = consumeSpaces(s.slice(5))
  return extractExp(expressionParser(s))
}

function extractExp (s) {
  if (s[0] !== '(') return null
  let exp = '('
  s = consumeSpaces(s.slice(1))
  if (s.startsWith('lambda')) return lambdaOp(s)
  if (!(s.startsWith('lambda'))) {
    lambdaOp(s)
  }
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

function setOp (s) {
  if (!(s.startsWith('set!'))) return null
  s = consumeSpaces(s.slice(4))
  s = updateEnv(s, 1)
  return s
}

function lambdaOp (s) {
  if (!(s.startsWith('lambda'))) return null
  console.log('===========From lambdaop==============')
  let variables = (extractExp(consumeSpaces(s.slice(6))))
  if (variables !== null) {
    let lExpression = (extractExp(consumeSpaces(variables[1])))
    console.log(lExpression)
    if (lExpression !== null) {
      console.log([[variables[0], lExpression[0]], lExpression[1]])
      return [[variables[0], lExpression[0]], lExpression[1]]
    }
  }
  return null
}

function getParamName (s) {
  let resSymbol = ''
  let remS = s
  while (true) {
    if (remS[0] === ' ' || remS[0] === ')' || remS[0] === ')') break
    resSymbol += remS[0]
    remS = remS.slice(1)
  }
  return [resSymbol, remS]
}

function paramList (s) {
  if (s[0] !== '(') return null
  s = s.slice(1)
  let paramL = []
  while (true) {
    if (s[0] === ')') return [paramL, s.slice(1)]
    let resGAN = getParamName(consumeSpaces(s))
    if (resGAN === null) return [paramL, s]
    paramL.push(resGAN[0])
    s = resGAN[1]
  }
}

function argValues (s) {

}

function localEnv (argL, argV) {

}
