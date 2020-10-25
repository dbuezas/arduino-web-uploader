import serial from './Serial'
import async from 'async'
import * as intel_hex from 'intel-hex'
import Stk500 from 'stk500'

type Board = {
  signature: Buffer
  pageSize: number
  timeout: number
  baudRate: number
}

export const boards = {
  lgt8f328p: {
    signature: Buffer.from([0x1e, 0x95, 0x0f]),
    pageSize: 128,
    timeout: 400,
    baudRate: 57600,
  } as Board,
  nanoOldBootloader: {
    signature: Buffer.from([0x1e, 0x95, 0x0f]),
    pageSize: 128,
    timeout: 400,
    baudRate: 57600,
  } as Board,
  nano: {
    signature: Buffer.from([0x1e, 0x95, 0x0f]),
    pageSize: 128,
    timeout: 400,
    baudRate: 115200,
  } as Board,
  uno: {
    signature: Buffer.from([0x1e, 0x95, 0x0f]),
    pageSize: 128,
    timeout: 400,
    baudRate: 115200,
  } as Board,
  proMini: {
    signature: Buffer.from([0x1e, 0x95, 0x0f]),
    pageSize: 128,
    timeout: 400,
    baudRate: 115200,
  } as Board,
}

const noop = (callback: () => void) => callback()
export async function upload(
  board: Board,
  hexFileHref: string,
  onProgress: (percentage: number) => void,
  verify = false,
) {
  try {
    const hex = await fetch(hexFileHref)
      .then((response) => response.text())
      .then((text) => intel_hex.parse(text).data)
    const serialStream = await serial.connect({ baudRate: board.baudRate })
    onProgress(0)

    const stk500 = new Stk500()
    let sent = 0
    let total = hex.length / board.pageSize
    if (verify) total *= 2
    stk500.log = (what: string) => {
      if (what === 'page done' || what === 'verify done') {
        sent += 1
        const percent = Math.round((100 * sent) / total)
        onProgress(percent)
      }
    }

    await async.series([
      // send two dummy syncs like avrdude does
      stk500.sync.bind(stk500, serialStream, 3, board.timeout),
      stk500.sync.bind(stk500, serialStream, 3, board.timeout),
      stk500.sync.bind(stk500, serialStream, 3, board.timeout),
      stk500.verifySignature.bind(stk500, serialStream, board.signature, board.timeout),
      stk500.setOptions.bind(stk500, serialStream, {}, board.timeout),
      stk500.enterProgrammingMode.bind(stk500, serialStream, board.timeout),
      stk500.upload.bind(stk500, serialStream, hex, board.pageSize, board.timeout),
      !verify ? noop : stk500.verify.bind(stk500, serialStream, hex, board.pageSize, board.timeout),
      stk500.exitProgrammingMode.bind(stk500, serialStream, board.timeout),
    ])
  } finally {
    serial.close()
  }
}

export default upload
