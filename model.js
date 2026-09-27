export const cycles = { monthly: '每月', quarterly: '每季', yearly: '每年', weekly: '每周' };
export const currencies = ['JPY', 'USD', 'CNY', 'EUR', 'GBP', 'HKD', 'TWD', 'KRW', 'SGD', 'AUD', 'CAD'];
export const categories = ['影音娱乐', '效率工具', '云端存储', '域名服务', '服务器托管', '生活服务', '住房租金', '通讯网络', '保险保障', '游戏服务', '其他'];
export const sections = [
  { id: 'app', name: 'App 订阅', icon: 'layers', categories: ['影音娱乐', '效率工具', '云端存储'], hint: '视频、音乐、效率工具与云存储，把常用的 App 放在一起。', placeholder: '例如 Netflix、Spotify、ChatGPT' },
  { id: 'domain', name: '域名订阅', icon: 'globe', categories: ['域名服务'], hint: '记录域名续费金额与日期，提前安排下一次续费。', placeholder: '例如 aimer.moe 域名续费' },
  { id: 'server', name: '服务器订阅', icon: 'server', categories: ['服务器托管'], hint: 'VPS、云服务器与主机托管，按账单周期管理基础设施费用。', placeholder: '例如 VPS、云服务器、网站托管' },
  { id: 'life', name: '生活开支', icon: 'home', categories: ['生活服务', '住房租金', '通讯网络', '保险保障'], hint: '房租、话费、宽带与保险，整理每月或每年的固定开支。', placeholder: '例如 房租、手机话费、年度保险' },
  { id: 'game', name: '游戏开支', icon: 'game', categories: ['游戏服务'], hint: '游戏会员、月卡与通行证，仅记录会周期性续费的项目。', placeholder: '例如 Xbox Game Pass、游戏月卡' },
  { id: 'other', name: '其他开支', icon: 'wallet', categories: ['其他'], hint: '暂时不属于以上分区的周期性支出，可以先放在这里。', placeholder: '填写服务或支出名称' }
];
export const sectionFor = category => sections.find(section => section.categories.includes(category));
export const paymentPresets = ['Visa', 'Mastercard', 'JCB', 'American Express', '银联', '支付宝', '微信支付', 'PayPal', 'Apple Pay', '银行转账', '现金'];
export function validatePaymentMethods(value) {
  if (!Array.isArray(value) || value.length > 100 || value.some(method => typeof method !== 'string' || !method.trim() || method.length > 80)) throw new Error('曾用付款方式格式无效');
  return [...new Set(value.map(method => method.trim()))];
}
export const dateKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseDate = value => new Date(`${value}T00:00:00`);
export const monthly = s => s.amount * ({ monthly: 1, quarterly: 1 / 3, yearly: 1 / 12, weekly: 52 / 12 }[s.cycle]);
export function nextPayment(s, today = new Date()) {
  if (!s.date) return null;
  const anchor = parseDate(s.date);
  const start = parseDate(dateKey(today));
  if (anchor >= start) return anchor;
  if (s.cycle === 'weekly') {
    const days = Math.round((Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()) - Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())) / 86400000);
    anchor.setDate(anchor.getDate() + Math.ceil(days / 7) * 7);
    return anchor;
  }
  const step = { monthly: 1, quarterly: 3, yearly: 12 }[s.cycle];
  let offset = Math.floor(((start.getFullYear() - anchor.getFullYear()) * 12 + start.getMonth() - anchor.getMonth()) / step) * step;
  const occurrence = n => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth() + n, 1);
    return new Date(first.getFullYear(), first.getMonth(), Math.min(anchor.getDate(), new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()));
  };
  let next = occurrence(offset);
  if (next < start) next = occurrence(offset += step);
  return next;
}
export function validate(items) {
  if (!Array.isArray(items) || items.length > 5000) throw new Error('订阅数据格式不正确，或超过 5000 条。');
  const ids = new Set();
  return items.map(s => {
    if (!s || typeof s.id !== 'string' || !s.id || ids.has(s.id) || typeof s.name !== 'string' || !s.name.trim() || s.name.length > 80 || !Number.isFinite(s.amount) || s.amount < 0 || s.amount > 1e9 || !currencies.includes(s.currency) || !Object.hasOwn(cycles, s.cycle) || !categories.includes(s.category) || !['active', 'paused'].includes(s.status) || typeof s.method !== 'string' || s.method.length > 80 || typeof s.notes !== 'string' || s.notes.length > 500 || typeof s.date !== 'string' || (s.date && (!/^\d{4}-\d{2}-\d{2}$/.test(s.date) || s.date < '1900-01-01' || s.date > '9999-12-31' || !Number.isFinite(parseDate(s.date).getTime()) || dateKey(parseDate(s.date)) !== s.date))) throw new Error('订阅字段无效，请检查备份文件。');
    ids.add(s.id);
    return { id: s.id, name: s.name.trim(), amount: s.amount, currency: s.currency, cycle: s.cycle, category: s.category, status: s.status, method: s.method, date: s.date, notes: s.notes };
  });
}
export function calculateSpending(items) {
  if (!Array.isArray(items) || !items.length) return [];
  const map = new Map();
  for (const s of items) {
    if (!map.has(s.currency)) map.set(s.currency, []);
    map.get(s.currency).push(s);
  }
  return [...map.entries()].map(([currency, list]) => {
    const allYearly = list.every(s => s.cycle === 'yearly');
    const allMonthly = list.every(s => s.cycle === 'monthly');
    const monthlySum = list.reduce((sum, s) => sum + monthly(s), 0);
    const yearlySum = allYearly ? list.reduce((sum, s) => sum + s.amount, 0) : monthlySum * 12;

    let type = 'mixed';
    if (allYearly) type = 'yearly';
    else if (allMonthly) type = 'monthly';

    return {
      currency,
      type,
      monthly: allMonthly ? list.reduce((sum, s) => sum + s.amount, 0) : monthlySum,
      yearly: yearlySum,
      count: list.length
    };
  });
}
