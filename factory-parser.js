// exports.numParser = numberParser
// exports.expParser = expressionParser

let createScope = (localEnv, outer) => {
  return {
    update (localEnv) {
      Object.assign(this, localEnv)
    },
    find (k) {
      console.log('From Inside scope object D:')
      console.log(k)
      if (k in localEnv) return localEnv[k]
      else return outer.find(k)
    }
  }
}

let Environment = {
  globalEnv: {
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
    // 'map':
    // 'max':
    // 'min':
    'not': (x) => !(x),
    'null?': (x) => x === null,
    'number?': (x) => (typeof x) === 'number',
    'print': (x) => console.log(x[0]),
    // 'procedure?':
    'round': (x) => Math.round(x),
    'symbol?': (x) => (typeof x) === 'string'
  },
  update (globals) {
    Object.assign(this.globalEnv, globals)
  },
  find (k) {
    if (k in this.globalEnv) return this.globalEnv[k]
    else return null
  }
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

function parseSymbol (s, env, set = 0) {
  console.log('================ From parseSymbol ================')
  console.log(env)
  let resSymbol = ''
  let remS = s
  while (true) {
    if (remS[0] === ' ' || remS[0] === '(' || remS[0] === ')') break
    if (remS.length === 0) return null
    resSymbol += remS[0]
    remS = remS.slice(1)
  }
  if (env.find(resSymbol) && set !== 1) resSymbol = env.find(resSymbol)
  if (resSymbol.length !== 0 || typeof resSymbol === 'function') return [resSymbol, remS]
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

function atomize (s, env) {
  let res = numberParser(s) || parseSymbol(s, env)
  if (res === null) return null
  s = res[1]
  console.log(res)
  if (!(s[0] !== ' ' || s[0] !== ')')) return null
  return [res[0], s]
}

function defineOp (s, env) {
  if (!(s.startsWith('define'))) return null
  s = s.slice(6)
  console.log('---------------From defineOp()------------------')
  console.log(env)
  console.log(s)
  s = updateEnv(s, env)
  if (s !== null) return [[], s]
}

function updateEnv (s, env, set = 0) {
  s = consumeSpaces(s)
  console.log('============From updateEnv resPS==========')
  console.log(env)

  let resPS = parseSymbol(s, env, set)
  console.log(resPS)
  if (resPS !== null) {
    let [v, remS] = resPS
    if (set === 1) if (!(env.find(v))) return null
    let resNP = numberParser(consumeSpaces(remS))
    console.log('------------From updateEnv resNP----------')
    console.log(resNP)
    if (resNP !== null) {
      let [vn, remSn] = resNP
      let envUp = {}
      envUp[v] = vn
      env.update(envUp)
      return [[], remSn]
    } else {
      let proc = extractExp(consumeSpaces(remS))
      if (proc !== null && proc[0].slice(1).startsWith('lambda ')) {
        let resLO = lambdaOp(proc[0].slice(1))
        if (resLO !== null) {
          proc = [procedure(resLO[0][0], resLO[0][1], env), resLO[1]]
        }
      }
      console.log('-----------From updateEnv proc---------')
      console.log(proc)
      if (proc === null) return null
      let envUp = {}
      envUp[v] = proc[0]
      env.update(envUp)
      return [[], proc[1]]
    }
  }
  return null
}

function lambdaOp (s) {
  if (!(s.startsWith('lambda '))) return null
  console.log('===========From lambdaop==============')
  let variables = (extractExp(consumeSpaces(s.slice(7))))
  if (variables !== null) {
    let lExpression = (extractExp(consumeSpaces(variables[1])))
    console.log(lExpression)
    if (lExpression !== null) {
      console.dir([[paramList(variables[0])[0], lExpression[0]], lExpression[1]], { 'depth': null })
      return [[paramList(variables[0])[0], lExpression[0]], lExpression[1]]
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

let procedure = function lambda (params, body, env) {
  return function procWithEnv (...args) {
    let lEnv = {}
    params.forEach(function (k, i) { lEnv[k] = args[i] })
    let procEnv = createScope(lEnv, env)
    return parseEval(body, procEnv)
  }
}

function expressionParser (s, env) {
  console.log('=======From expressionParser----------')
  console.log(env)
  if (s[0] !== '(') return null
  let valList = []
  s = consumeSpaces(s.slice(1))
  if (s.startsWith('define ')) s = updateEnv(s.slice(7), 0, env)
  else {
    let respKW = atomize(s, env)
    console.log(respKW)
    console.log(s)
    if (respKW === null) return null
    let func = respKW[0]
    if (typeof func !== 'function') { func = env.find(respKW[0]) }
    s = respKW[1]
    while (true) {
      if (!s) return null
      console.log('===============From expressionParser()==============')
      console.log(String(env))
      console.log(func)
      console.log(valList)
      console.log(s)
      s = consumeSpaces(s)
      if (s[0] === ')') {
        console.log([func(...valList), s.slice(1)])
        return [func(...valList), s.slice(1)]
      }
      if (s[0] === '(') {
        let resExp = expressionParser(s, env)
        if (resExp === null) return null
        else {
          valList.push(resExp[0])
          s = resExp[1]
        }
      }
      s = consumeSpaces(s)
      let resP = numberParser(s) || parseSymbol(s, env)
      if (resP !== null) {
        if (resP[0] === 'define ') {
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

function parseEval (s, env) {
  // if (env.find(s)) return env.find(s)
  console.log('--------From parseEvl-----------')
  let currVal = null
  if (!s.startsWith('(')) return null
  s = s.slice(1).trimStart()
  console.log(s)
  if (s[0] === '(') {
    let resPE = parseEval(s, env)
    if (resPE !== null) {
      currVal = resPE[0]
      s = resPE[1]
    }
  }
  if (s[0] === ')') return [currVal, s]
  if (s.startsWith('define ')) {
    let resD = defineOp(s, env)
    if (resD === null) return null
    currVal = []
    return resD
  }
  if (s.startsWith('lambda ')) {
  } else {
    let resEP = expressionParser('(' + s, env)
    if (resEP === null) return null
    if (resEP[1].trimStart().length > 0) return null
    else {
      return resEP[0]
    }
  }
}
