import { execFile, ExecFileOptions } from 'child_process'

type ExecResult = {
  stdout: string
  stderr: string
}

export async function exec(file: string, args?: any[], opts?: ExecFileOptions): Promise<ExecResult> {
  const options = {...opts}
  const promise = new Promise<ExecResult>((resolve, reject) => {
    execFile(file, args, options, (err: Error | null, stdout: string, stderr: string): void => {
      if (err) {
        return reject(err)
      }
      resolve({ stdout, stderr })
    })
  })
  return promise
}
