/** Sister site: Japan manhole-card collector (prefecture deep links). */
export const MANHOLE_ORIGIN = 'https://manholecard.vercel.app';

/** JIS X 0401 prefecture codes → short display label (zh-TW / common trip wording). */
const PREFECTURES = {
  '01': { label: '北海道', aliases: ['北海道', '登別', '札幌', '小樽', '旭川', '富良野', '美瑛', '定山溪'] },
  '02': { label: '青森', aliases: ['青森', '青森県', '弘前'] },
  '03': { label: '岩手', aliases: ['岩手', '岩手県', '盛岡'] },
  '04': { label: '宮城', aliases: ['宮城', '宮城県', '仙台'] },
  '05': { label: '秋田', aliases: ['秋田', '秋田県'] },
  '06': { label: '山形', aliases: ['山形', '山形県'] },
  '07': { label: '福島', aliases: ['福島', '福島県'] },
  '08': { label: '茨城', aliases: ['茨城', '茨城県'] },
  '09': { label: '栃木', aliases: ['栃木', '栃木県'] },
  '10': { label: '群馬', aliases: ['群馬', '群馬県'] },
  '11': { label: '埼玉', aliases: ['埼玉', '埼玉県', '長瀞', '秩父'] },
  '12': { label: '千葉', aliases: ['千葉', '千葉県'] },
  '13': { label: '東京', aliases: ['東京', '東京都'] },
  '14': { label: '神奈川', aliases: ['神奈川', '神奈川県'] },
  '15': { label: '新潟', aliases: ['新潟', '新潟県'] },
  '16': { label: '富山', aliases: ['富山', '富山県'] },
  '17': { label: '石川', aliases: ['石川', '石川県', '金澤', '金沢'] },
  '18': { label: '福井', aliases: ['福井', '福井県'] },
  '19': { label: '山梨', aliases: ['山梨', '山梨県'] },
  '20': { label: '長野', aliases: ['長野', '長野県'] },
  '21': { label: '岐阜', aliases: ['岐阜', '岐阜県', '高山', '白川鄉', '白川郷', '下呂'] },
  '22': { label: '靜岡', aliases: ['靜岡', '静岡', '静岡県', '熱海', '伊東'] },
  '23': { label: '愛知', aliases: ['愛知', '愛知県', '名古屋'] },
  '24': { label: '三重', aliases: ['三重', '三重県'] },
  '25': { label: '滋賀', aliases: ['滋賀', '滋賀県'] },
  '26': { label: '京都', aliases: ['京都', '京都府'] },
  '27': { label: '大阪', aliases: ['大阪', '大阪府'] },
  '28': { label: '兵庫', aliases: ['兵庫', '兵庫県'] },
  '29': { label: '奈良', aliases: ['奈良', '奈良県'] },
  '30': { label: '和歌山', aliases: ['和歌山', '和歌山県'] },
  '31': { label: '鳥取', aliases: ['鳥取', '鳥取県'] },
  '32': { label: '島根', aliases: ['島根', '島根県'] },
  '33': { label: '岡山', aliases: ['岡山', '岡山県'] },
  '34': { label: '廣島', aliases: ['廣島', '広島', '広島県'] },
  '35': { label: '山口', aliases: ['山口', '山口県'] },
  '36': { label: '德島', aliases: ['德島', '徳島', '徳島県'] },
  '37': { label: '香川', aliases: ['香川', '香川県', '高松', '小豆島'] },
  '38': { label: '愛媛', aliases: ['愛媛', '愛媛県', '松山', '宇和島'] },
  '39': { label: '高知', aliases: ['高知', '高知県', '祖谷'] },
  '40': { label: '福岡', aliases: ['福岡', '福岡県'] },
  '41': { label: '佐賀', aliases: ['佐賀', '佐賀県'] },
  '42': { label: '長崎', aliases: ['長崎', '長崎県'] },
  '43': { label: '熊本', aliases: ['熊本', '熊本県'] },
  '44': { label: '大分', aliases: ['大分', '大分県'] },
  '45': { label: '宮崎', aliases: ['宮崎', '宮崎県'] },
  '46': { label: '鹿兒島', aliases: ['鹿兒島', '鹿児島', '鹿児島県'] },
  '47': {
    label: '沖繩',
    aliases: ['沖繩', '沖縄', '沖縄県', '那霸', '那覇', '恩納', '名護', '本部', '北谷', '南城', '古宇利'],
  },
};

const ALIAS_TO_CODE = (() => {
  const map = new Map();
  for (const [code, pref] of Object.entries(PREFECTURES)) {
    for (const alias of pref.aliases) {
      const key = normalizeToken(alias);
      if (key && !map.has(key)) map.set(key, code);
    }
  }
  return map;
})();

function normalizeToken(text) {
  return String(text || '')
    .normalize('NFKC')
    .replace(/(都|道|府|県|縣)$/u, '')
    .trim();
}

/** Japan gate: trip id / title / location text contains 日本. */
export function isJapanTrip(meta = {}, tripId = '') {
  const hay = [tripId, meta.slug, meta.title, meta.subtitle, meta.badge, meta.location, meta.routeRegions]
    .filter(Boolean)
    .join(' ');
  return /日本/.test(hay);
}

function splitRegionTokens(text) {
  if (!text) return [];
  return String(text)
    .split(/[・·、,，/\s]+/u)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Resolve prefecture codes from routeRegions / location / title tokens.
 * @returns {{ code: string, label: string }[]}
 */
export function resolvePrefectures(meta = {}) {
  const tokens = [
    ...splitRegionTokens(meta.routeRegions),
    ...splitRegionTokens(meta.location),
    ...splitRegionTokens(meta.subtitle),
  ];

  const seen = new Set();
  const out = [];
  for (const token of tokens) {
    const code = ALIAS_TO_CODE.get(normalizeToken(token));
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push({ code, label: PREFECTURES[code].label });
  }
  return out;
}

export function manholeMapUrl(prefectureCode) {
  const url = new URL('/map', MANHOLE_ORIGIN);
  if (prefectureCode) url.searchParams.set('prefecture', prefectureCode);
  return url.href;
}
