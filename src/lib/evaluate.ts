const isOp = (t: string) => ['+', '-', '×', '÷'].includes(t)

export function evaluate(input: string): string {
  const tokens = input.replace(/−/g, '-').match(/\d+\.?\d*|\.\d+|[+\-×÷]/g)
  if (!tokens) return '0'

  const list: (number | string)[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t === '-' && (i === 0 || isOp(tokens[i - 1]))) {
      const next = tokens[i + 1]
      if (next === undefined || isOp(next)) return 'Error'
      list.push(-parseFloat(next))
      i++
    } else if (isOp(t)) {
      list.push(t)
    } else {
      list.push(parseFloat(t))
    }
  }

  if (typeof list[list.length - 1] === 'string') list.pop() // trailing operator
  for (let i = 0; i < list.length; i++) {
    if ((i % 2 === 0) !== (typeof list[i] === 'number')) return 'Error'
  }

  // pass 1: × and ÷
  const stack: (number | string)[] = [list[0]]
  for (let i = 1; i < list.length; i += 2) {
    const op = list[i] as string
    const n = list[i + 1] as number
    const last = stack.length - 1
    if (op === '×') stack[last] = (stack[last] as number) * n
    else if (op === '÷') {
      if (n === 0) return 'Error'
      stack[last] = (stack[last] as number) / n
    } else stack.push(op, n)
  }

  // pass 2: + and -
  let result = stack[0] as number
  for (let i = 1; i < stack.length; i += 2) {
    const n = stack[i + 1] as number
    result = stack[i] === '+' ? result + n : result - n
  }
  return String(Math.round(result * 1e10) / 1e10)
}