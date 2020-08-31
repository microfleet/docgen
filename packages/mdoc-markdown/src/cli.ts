import argv from './cli-args'
import { generateFs } from './generate'

(async function run() {
  await generateFs(argv)
})()
