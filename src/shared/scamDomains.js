// Dominios habituales de estafa (nitro gratis, phishing de Steam/robo de
// cuentas, clones de Discord). Lista básica y ampliable a mano; no pretende
// ser exhaustiva, solo atrapar los patrones más comunes en raids/spam.
export const SCAM_DOMAINS = [
  'dlscord-nitro.com',
  'discocl.com',
  'discordgift.site',
  'discordnitro.gift',
  'discord-gift.info',
  'discordapp.gifts',
  'steamcommunnity.com',
  'steamconmunity.com',
  'steancommunity.com',
  'stearncommunity.com',
  'freegiftnitro.com',
  'nitro-gift.net',
  'discord-airdrop.com',
];

export function findScamDomain(content) {
  const urls = content.match(/https?:\/\/[^\s]+/gi) || [];
  for (const url of urls) {
    try {
      const host = new URL(url).hostname.toLowerCase();
      const match = SCAM_DOMAINS.find((d) => host === d || host.endsWith(`.${d}`));
      if (match) return { url, domain: match };
    } catch {
      // URL inválida, se ignora
    }
  }
  return null;
}
