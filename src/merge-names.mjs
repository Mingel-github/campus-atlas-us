import { readFileSync, writeFileSync } from 'node:fs';

const current = JSON.parse(readFileSync(new URL('../schools.json', import.meta.url), 'utf8'));
const additions = JSON.parse(readFileSync(new URL('./additions.json', import.meta.url), 'utf8'));
const schools = [...current.filter(school => school.rank <= 100), ...additions]
  .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
const names = {
  ...JSON.parse(readFileSync(new URL('./names-zh.json', import.meta.url), 'utf8')),
  ...JSON.parse(readFileSync(new URL('./names-zh-additions.json', import.meta.url), 'utf8'))
};
const qsRanks = JSON.parse(readFileSync(new URL('./qs-ranks.json', import.meta.url), 'utf8'));

for (const school of schools) {
  if (!names[school.id]) throw new Error(`缺少中文名：${school.name}`);
  school.nameZh = names[school.id];
  if (qsRanks[school.id]) school.qsRank = qsRanks[school.id];
}

if (new Set(schools.map(school => school.id)).size !== schools.length) throw new Error('学校 ID 重复');
if (Object.keys(names).length !== schools.length) throw new Error('中文名数量与学校数量不一致');
writeFileSync(new URL('../schools.json', import.meta.url), `${JSON.stringify(schools, null, 2)}\n`);
