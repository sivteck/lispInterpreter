exports.stringParser = stringParser
exports.numParser = numberParser
exports.expParser = expressionParser

const Environment = {
  '+': (vals) => vals.reduce((x, y) => x + y, 0),
  '-': (vals) => vals.slice(1).reduce((x, y) => x - y, vals[0]),
  '*': (vals) => vals.reduce((x, y) => x * y, 1)
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

// isChar :: Char -> Parser Char
function isChar (c) {
  return function charParser (s) {
    if (s[0] === c) return [c, s.slice(1)]
    else return null
  }
}

function hexParser (s) {
  let fChar = s[0].charCodeAt()
  if (((fChar >= 48) && (fChar <= 57)) || fChar >= 97 || fChar <= 102 || fChar >= 65 || fChar <= 70) { return [fChar, s.slice(1)] } else return null
}

function unicodeParser (s) {
  if (s[0] === '\\') s = s.slice(1)
  const unicodeParse = isChar('u')
  let uPR = unicodeParse(s)
  if (uPR === null) return null
  for (let i = 0; i < 4; i++) {
    if (hexParser(s.slice(i + 1)) != null) {
      continue
    } else return null
  }
  return [s.slice(0, 5), s.slice(5)]
}

function stringParser (s) {
  const justQuoteP = isChar('"')
  const quoteParser = isChar('"')
  const rSolidusParser = isChar('\\')
  const solidusParser = isChar('/')
  const backspaceParser = isChar('b')
  const formfeedParser = isChar('f')
  const newlineParser = isChar('n')
  const crParser = isChar('r')
  const htabParser = isChar('t')

  const specialParsers = [quoteParser, solidusParser, backspaceParser, formfeedParser, newlineParser, crParser, htabParser, unicodeParser, rSolidusParser]

  function applyParsers (s) {
    for (let i = 0; i < specialParsers.length; i++) {
      let aresP = specialParsers[i](s)
      if (aresP !== null) return aresP
    }
    return null
  }

  let parsed = ''
  let ind = 0
  let remainingString = s.slice(ind)
  let quotesParsed = 0

  if (ind === 0) {
    let initC = justQuoteP(s)
    if (initC === null) {
      return null
    }
  }
  quotesParsed++
  ind++
  let flagQ = 0

  while (true) {
    remainingString = s.slice(ind)
    if (quotesParsed === 2) {
      if (flagQ === 1) flagQ -= 1
      else return [parsed, remainingString]
    }
    let iniC = remainingString[0]
    // Handle special characters that are not escaped
    if (iniC === '\n' || iniC === '\t' || iniC === '\r' || iniC === '\f' || iniC === '\b' || iniC === '\b') return null
    let checkBackslash = rSolidusParser(remainingString)
    if (checkBackslash !== null) {
      let resP = applyParsers(remainingString.slice(1))
      flagQ = 1
      if (resP === null) return null
      else {
        // parsed += checkBackslash[0]
        parsed += resP[0]
        remainingString = resP[1]
        if (resP[0].length > 1) ind += (resP[0].length + 1)
        else ind += 2
        if (quotesParsed === 2) quotesParsed -= 1
      }
    } else flagQ = 0

    let qRes = justQuoteP(remainingString)
    if (qRes !== null) {
      quotesParsed++
    }
    ind++
    if (qRes === null && remainingString.length !== 0) parsed += remainingString[0]
  }
}

function expressionParser (s) {
  if (s[0] !== '(') return null
  s = s.slice(1)
  let valList = []
  s = consumeSpaces(s)
  let func = Environment[s[0]]
  s = s.slice(1)
  while (true) {
    s = consumeSpaces(s)
    if (s[0] === ')') return [func(valList), s.slice(1)]
    if (s[0] === '(') {
      let resExp = expressionParser(s)
      if (resExp === null) return null
      else {
        valList.push(resExp[0])
        s = resExp[1]
      }
    }
    s = consumeSpaces(s)
    let resP = numberParser(s)
    if (resP !== null) {
      let [v, remS] = resP
      valList.push(v)
      console.log(valList)
      s = remS
    }
  }
