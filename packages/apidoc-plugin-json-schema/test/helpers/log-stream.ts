import { Writable, WritableOptions } from 'stream'

export class LogStream extends Writable {
  public logs: any[]

  constructor(params: WritableOptions) {
    params.objectMode = true
    super(params)
    this.logs = []
  }

  _write(chunk: Buffer | Record<string, any>, _: string, cb: () => void): void {
    this.logs.push(chunk)
    cb()
  }
}
