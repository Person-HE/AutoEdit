import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateDir = path.join(__dirname, '..', 'src', 'engine', 'templates');

const subdirs = ['text', 'ui', 'background', 'effect', 'code'];

for (const subdir of subdirs) {
  const dir = path.join(templateDir, subdir);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(/from '\.\/types'/g, "from '../types'");
    content = content.replace(/from "\.\/types"/g, "from '../types'");
    content = content.replace(/from '\.\/templateUtils'/g, "from '../templateUtils'");
    content = content.replace(/from "\.\/templateUtils"/g, "from '../templateUtils'");

    // 如果文件使用了 hash 但未导入，添加导入
    if (content.includes('hash.') && !content.includes('hash')) {
      content = content.replace(
        "import { paramGuard, drawUtils, easing } from '../templateUtils';",
        "import { paramGuard, drawUtils, easing, hash } from '../templateUtils';"
      );
      content = content.replace(
        "import { paramGuard, colorUtils, easing, drawUtils } from '../templateUtils';",
        "import { paramGuard, colorUtils, easing, drawUtils, hash } from '../templateUtils';"
      );
      content = content.replace(
        "import { paramGuard, drawUtils, easing, hash } from '../templateUtils';",
        "import { paramGuard, drawUtils, easing, hash } from '../templateUtils';"
      );
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${path.join(subdir, file)}`);
  }
}

console.log('Import paths fixed.');
