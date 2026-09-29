// src/utils/permissions.js

/**
 * 从 localStorage 读取 user_info，并安全解析
 */
export function getUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('user_info') || '{}') || {};
  } catch (e) {
    console.warn('[getUserInfo] parse user_info failed:', e);
    return {};
  }
}

/**
 * 把后端返回的 permissions（可能是字符串/数组）统一解析成数组
 * 支持：
 *  1) "['1.xxx','2.xxx']" 这种单引号数组字符串
 *  2) '["1.xxx","2.xxx"]' 这种标准 JSON 字符串
 *  3) 直接就是数组 ['1.xxx', '2.xxx']
 */
export function parsePermissions(raw) {
  if (!raw) return [];

  // 已经是数组
  if (Array.isArray(raw)) return raw.map(String);

  // 不是字符串就直接兜底
  if (typeof raw !== 'string') return [];

  const text = raw.trim();
  if (!text) return [];

  // 先尝试标准 JSON
  try {
    const arr = JSON.parse(text);
    if (Array.isArray(arr)) return arr.map(String);
  } catch (_) {}

  // 再兼容单引号数组：把单引号替换成双引号
  // 注意：这里假设权限项里不会包含需要保留的单引号字符（一般不会）
  try {
    const normalized = text.replace(/'/g, '"');
    const arr = JSON.parse(normalized);
    if (Array.isArray(arr)) return arr.map(String);
  } catch (e) {
    console.warn('[parsePermissions] failed:', e, 'raw=', raw);
  }

  return [];
}

/**
 * 创建一个易用的权限对象：
 *  - has('2.分类修改')
 *  - hasAny(['a','b'])
 */
export function buildPermissionHelper(permissionsArray) {
  const set = new Set((permissionsArray || []).map(p => String(p).trim()).filter(Boolean));

  return {
    list: Array.from(set),
    has: (perm) => set.has(String(perm).trim()),
    hasAny: (perms) => (perms || []).some(p => set.has(String(p).trim())),
  };
}

/**
 * 一步到位：从 localStorage 读取并构建权限 helper
 */
export function getPermissionHelperFromLocal() {
  const userInfo = getUserInfo();
  const perms = parsePermissions(userInfo.permissions);
  return {
    userInfo,
    perm: buildPermissionHelper(perms),
  };
}
