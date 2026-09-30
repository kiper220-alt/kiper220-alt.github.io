// RPM epoch/version/release comparison shared by both site modes.
const digit = (c: string) => /^[0-9]$/.test(c);
const alpha = (c: string) => /^[A-Za-z]$/.test(c);
const alnum = (c: string) => digit(c) || alpha(c);

export function rpmvercmp(a: string, b: string): number {
  if (a === b) return 0;
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    while (i < a.length && !alnum(a[i]) && a[i] !== '~' && a[i] !== '^') i++;
    while (j < b.length && !alnum(b[j]) && b[j] !== '~' && b[j] !== '^') j++;
    if (a[i] === '~' || b[j] === '~') {
      if (a[i] !== '~') return 1;
      if (b[j] !== '~') return -1;
      i++; j++; continue;
    }
    if (a[i] === '^' || b[j] === '^') {
      if (i >= a.length) return -1;
      if (j >= b.length) return 1;
      if (a[i] !== '^') return 1;
      if (b[j] !== '^') return -1;
      i++; j++; continue;
    }
    if (i >= a.length || j >= b.length) break;
    const numeric = digit(a[i]);
    let e1 = i, e2 = j;
    while (e1 < a.length && (numeric ? digit(a[e1]) : alpha(a[e1]))) e1++;
    while (e2 < b.length && (numeric ? digit(b[e2]) : alpha(b[e2]))) e2++;
    if (e1 === i) return -1;
    if (e2 === j) return numeric ? 1 : -1;
    let s1 = a.slice(i, e1), s2 = b.slice(j, e2);
    if (numeric) {
      s1 = s1.replace(/^0+/, ''); s2 = s2.replace(/^0+/, '');
      if (s1.length !== s2.length) return Math.sign(s1.length - s2.length);
    }
    if (s1 !== s2) return s1 < s2 ? -1 : 1;
    i = e1; j = e2;
  }
  return Math.sign((i < a.length ? 1 : 0) - (j < b.length ? 1 : 0));
}

function splitEVR(evr: string): [bigint, string, string] {
  const colon = evr.indexOf(':');
  const epoch = colon < 0 ? 0n : BigInt(evr.slice(0, colon));
  const rest = evr.slice(colon + 1);
  const dash = rest.indexOf('-');
  return [epoch, dash < 0 ? rest : rest.slice(0, dash), dash < 0 ? '' : rest.slice(dash + 1)];
}

export function compareEVR(a: string, b: string): number {
  const x = splitEVR(a), y = splitEVR(b);
  if (x[0] !== y[0]) return x[0] > y[0] ? 1 : -1;
  return rpmvercmp(x[1], y[1]) || rpmvercmp(x[2], y[2]);
}
