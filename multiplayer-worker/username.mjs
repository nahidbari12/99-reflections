const blocked = /(?:fuck|shit|bitch|cunt|whore|slut|retard|nigg(?:er|a)|faggot|asshole|dickhead|motherfucker|bastard|kill(?:all|yourself)|(?:hate|death(?:to)?)(?:muslims?|jews?|christians?|gays?)|(?:قحبة|شرموطة|كسامك|كسمك|ابنالكلب))/u;
const standalone = /(?:^|[^a-z])(?:ass|dick|cock|twat|piss|kys)(?:$|[^a-z])/u;
const substitutions = { 0: "o", 1: "i", 2: "z", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b" };

export function blockedUsername(username) {
  const normalized = username.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  const folded = normalized.replace(/[01234578]/g, digit => substitutions[digit]);
  return [normalized, folded].some(value => {
    const compact = value.replace(/[-_]/g, "");
    return standalone.test(value) || standalone.test(compact) ||
      blocked.test(compact) || blocked.test(compact.replace(/(.)\1{2,}/gu, "$1$1"));
  });
}
