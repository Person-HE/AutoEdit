import fs from 'fs'
import path from 'path'

function countFiles(dir, exts) {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) n += countFiles(p, exts)
    else if (exts.some((x) => e.name.endsWith(x))) n++
  }
  return n
}

const presetsRoot = 'src/engine/presets'
const templatesRoot = 'src/engine/templates'

function countPresetLeaf(dir) {
  if (!fs.existsSync(dir)) return 0
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.ts') && e.name !== 'index.ts' && e.name !== 'types.ts')
    .length
}

const presetCats = fs.existsSync(presetsRoot)
  ? fs.readdirSync(presetsRoot, { withFileTypes: true }).filter((e) => e.isDirectory())
  : []
const presetCount = presetCats.reduce((s, c) => s + countPresetLeaf(path.join(presetsRoot, c.name)), 0)

const templateFiles = countFiles(templatesRoot, ['.ts'])
console.log(
  JSON.stringify(
    {
      presetCategories: presetCats.map((c) => c.name),
      presetCount,
      templateFiles,
    },
    null,
    2,
  ),
)
