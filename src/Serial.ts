import { ReadableWebToNodeStream } from 'readable-web-to-node-stream'
export type Port = {
  readable: ReadableStream
  writable: WritableStream
  open: (options: SerialOptions) => Promise<void>
  close: () => Promise<void>
  getInfo: () => { usbProductId: number; usbVendorId: number }
}
export type PortFilters = { filters?: { usbVendorId: number; usbProductId: number }[] }
export type NavigatorSerial = {
  requestPort: (optns: PortFilters) => Port
  getPorts: () => Promise<Port[]>
}
export type SerialOptions = {
  baudRate?: number
  dataBits?: number
  stopBits?: number
  parity?: string
  bufferSize?: number
  rtscts?: boolean
  xon?: boolean
  xoff?: boolean
  xany?: boolean
}
declare global {
  interface Window {
    serial: Serial
  }
  interface Navigator {
    serial: NavigatorSerial
  }
}

declare global {
  interface Window {
    serial2: Serial
  }
  interface Navigator {
    serial: NavigatorSerial
  }
}

export class Serial {
  port?: Port
  reader?: NodeJS.ReadableStream
  writer?: WritableStreamDefaultWriter

  async close() {
    if (this.reader) {
      const reader = this.reader
      this.reader = undefined
      // @ts-ignore
      // this is specific to the "readable-web-to-node-stream" library
      await reader.reader.cancel()
      // await this.reader.close() // this blocks if uploading failed
    }
    if (this.writer) {
      const writer = this.writer
      this.writer = undefined
      await writer.close()
    }
    if (this.port) {
      const port = this.port
      this.port = undefined
      await port.close()
    }
  }
  async connectWithPaired(options: SerialOptions) {
    const [port] = await navigator.serial.getPorts()
    if (!port) throw new Error('no paired')
    return this._connect(options, port)
  }
  async connect(options: SerialOptions, portFilters: PortFilters = {}) {
    const port = await navigator.serial.requestPort(portFilters)
    return this._connect(options, port)
  }
  async _connect(options: SerialOptions, port: Port) {
    options = {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      bufferSize: 255,
      rtscts: false,
      xon: false,
      xoff: false,
      ...options,
    }
    if (this.port) await this.close()
    this.port = port
    await this.port.open(options)
    this.reader = new ReadableWebToNodeStream(this.port.readable)
    this.writer = this.port.writable.getWriter()

    // next I'm faking a NodeJS.ReadWriteStream
    const rwStream = (this.reader as unknown) as NodeJS.ReadWriteStream
    // @ts-ignore
    rwStream.write = (buffer: string | Uint8Array, onDone: (err: Error | null | undefined) => void) => {
      this.writer!.write(buffer).then(() => onDone(null), onDone)
      return true
    }
    return rwStream
  }
}
const serial = new Serial()

export default serial
