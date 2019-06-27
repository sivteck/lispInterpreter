let createScope = (localEnv, outer) => {
  return {
    update (localEnv) {
      Object.assign(this, localEnv)
    },
    find (k) {
      if (k in localEnv) return localEnv[k]
      return outer.find(k)
    }
  }
}

let Environment = {
  globalEnv: {
    'pi': 3.14,
    '+': (...vals) => vals.reduce((x, y) => x + y, 0),
    '-': (...vals) => {
      if (vals.length === 1) return -1 * vals[0]
      return vals.slice(1).reduce((x, y) => x - y, vals[0])
    },
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
    if (s.slice(1)[0] === ' ') return [s[0] * 1, tempR]
    if (tempR[0] === ',' || tempR[0] === '}' || tempR[0] === ']' || tempR[0] === ')') return [s[0] * 1, tempR]
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
    if (remainingString.length === 0 /* || remainingString.trimStart()[0] === ')' */) {
      if (isNaN(parsed * 1)) return null
      return [parsed * 1, '']
    }
  }
}

function parseSymbol (s, env, set = 0) {
  let resSymbol = ''
  let remS = s
  while (true) {
    if (remS[0] === ' ' || remS[0] === '(' || remS[0] === ')') break
    if (remS.length === 0) return null
    resSymbol += remS[0]
    remS = remS.slice(1)
  }
  let fromScope = env.find(resSymbol)
  if ((fromScope !== null) && set !== 1) resSymbol = fromScope
  if (resSymbol.length !== 0 || typeof resSymbol === 'function') return [resSymbol, remS]
  else return null
}

function extractExp (s, env) {
  if (atomize(s, env)) { return atomize(s, env) }
  if (s[0] !== '(') return null
  let exp = '('
  s = s.slice(1).trimStart()
  while (true) {
    if (s.startsWith(')')) return [exp.concat(')'), s.slice(1)]
    if (s.length === 0) return null
    if (s.startsWith('(')) {
      let eExp = extractExp(s, env)
      if (eExp !== null) {
        exp += eExp[0]
        s = eExp[1]
      } else return null
    } else {
      exp += s[0]
      s = s.slice(1)
    }
  }
}

function quoteOp (s, env) {
  if (!(s.startsWith('quote '))) return null
  s = s.slice(6).trimStart()
  return extractExp(s, env)
}

function atomize (s, env) {
  if (typeof s === 'number') return s
  if (s === undefined) return null
  s = s.trimStart()
  let res = numberParser(s) || parseSymbol(s, env)
  if (res === null) return null
  s = res[1]
  if (!(s[0] !== ' ' || s[0] !== ')')) return null
  return res
}

function ifOp (s, env) {
  if (!(s.startsWith('if '))) return null
  s = consumeSpaces(s.slice(3))
  let evalCondition = expressionParser(s, env)
  if (evalCondition !== null) {
    let [v, remS] = evalCondition
    remS = consumeSpaces(remS)
    let evalSucc = extractExp(remS, env) || atomize(remS, env)
    if (v) {
      let [_, remS2] = extractExp(consumeSpaces(evalSucc[1]), env)
      return [parseEval(evalSucc[0], env), remS2]
    } else return expressionParser(consumeSpaces(evalSucc[1]), env)
  } else return null
}

function defineOp (s, env) {
  if (!(s.startsWith('define '))) return null
  s = s.slice(7)
  return updateEnv(s, env)
}

function updateEnv (s, env, set = 0) {
  s = consumeSpaces(s)

  let resPS = parseSymbol(s, env, set)
  if (resPS !== null) {
    let [v, remS] = resPS
    if (set === 1) if (!(env.find(v))) return null
    let resNP = numberParser(consumeSpaces(remS))
    if (resNP !== null) {
      let [vn, remSn] = resNP
      let envUp = {}
      envUp[v] = vn
      env.update(envUp)
      return [[], remSn.slice(1)]
    } else {
      let proc = extractExp(consumeSpaces(remS), env)
      if (proc !== null && proc[0].slice(1).startsWith('lambda ')) {
        let resLO = lambdaOp(proc[0].slice(1), env)
        if (resLO !== null) {
          proc = [procedure(resLO[0][0], resLO[0][1], env), resLO[1]]
        }
      }
      if (proc === null) return null
      let envUp = {}
      envUp[v] = proc[0]
      env.update(envUp)
      return [[], proc[1].slice(1)]
    }
  }
  return null
}

function lambdaOp (s, env) {
  if (!(s.startsWith('lambda '))) return null
  let variables = (extractExp(consumeSpaces(s.slice(7)), env))
  if (variables !== null) {
    let lExpression = (extractExp(consumeSpaces(variables[1]), env))
    if (lExpression !== null) {
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
    return parseEval(body, procEnv)[0]
  }
}

function expressionParser (s, env) {
  if (atomize(s, env)) { return atomize(s, env) }
  if (s[0] !== '(') return null
  let valList = []
  s = consumeSpaces(s.slice(1))
  if (s.startsWith('define ')) {
    let resUE = updateEnv(s.slice(7), env)[1]
    if (resUE !== null) {
      valList.push(resUE[0])
      s = resUE[1].slice(1)
    }
  } else {
    let respKW = atomize(s, env)
    if (respKW === null) return null
    let func = respKW[0]
    if (typeof func !== 'function') { func = env.find(respKW[0]) }
    s = respKW[1]
    while (true) {
      if (!s) return null
      s = consumeSpaces(s)
      if (s[0] === ')') {
        return [func(...valList), s.slice(1)]
      }
      if (s[0] === '(') {
        let resExp = parseEval(s, env)
        if (resExp === null) return null
        else {
          valList.push(resExp[0])
          s = resExp[1]
        }
      }
      s = s.trimStart()
      let resP = numberParser(s) || parseSymbol(s, env)
      if (resP !== null) {
        if (resP[0] === 'define ') {
          let resUE = updateEnv(s, env)[1]
          if (resUE === null) return null
          else s = resUE[1].slice(1)
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
  if (atomize(s, env)) { return atomize(s, env) }
  if (typeof s === 'function') return s
  let currVal = null
  s = s.slice(1).trimStart()
  if (s[0] === '(') {
    let resEP = expressionParser(s, env)
    if (resEP === null) return null
    s = resEP[1]
    if (typeof resEP[0] === 'function') {
      let func = resEP[0]
      var argsL = []
      resEP = parseEval(s, env)
      while (resEP !== null) {
        argsL.push(resEP[0])
        resEP = parseEval(s, env)
        if (resEP !== null) s = resEP[1]
      }
      return func(...argsL)
    }
    return resEP
  }
  if (s[0] === ')') return [currVal, s]
  if (s.startsWith('quote ')) return extractExp(s.slice(6).trimStart(), env)
  if (s.startsWith('define ')) return defineOp(s, env)
  if (s.startsWith('if ')) return ifOp(s, env)
  if (s.startsWith('lambda ')) {
    let resLO = lambdaOp(s, env)
    if (resLO !== null) {
      return [procedure(resLO[0][0], resLO[0][1], env), resLO[1]]
    }
  } else return expressionParser('(' + s, env)
}

exports.parseEval = parseEval
exports.environment = Environment
