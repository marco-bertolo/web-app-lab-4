const fs = require('fs');
const buf = fs.readFileSync('mindjoin_hero.riv');

const strings = [];
let cur = '';
for (let i = 0; i < buf.length; i++) {
  const b = buf[i];
  if (b >= 0x20 && b < 0x7f) cur += String.fromCharCode(b);
  else {
    if (cur.length >= 3) strings.push(cur);
    cur = '';
  }
}
if (cur.length >= 3) strings.push(cur);

const uniq = [...new Set(strings)];

// Look for identifier-like names: letters, digits, underscores, spaces only
const idLike = uniq.filter(s => {
  if (s.length < 3 || s.length > 64) return false;
  return /^[A-Za-z][A-Za-z0-9_\- ]{2,}$/.test(s);
});

console.log('Identifier-like strings:', idLike.length);
console.log('\n--- all identifier-like strings ---');
idLike.sort().forEach(s => console.log(JSON.stringify(s)));
