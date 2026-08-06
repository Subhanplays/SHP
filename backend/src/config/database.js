import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Map of model name -> SQLite table name
const MODELS = {
  user: 'users',
  product: 'products',
  order: 'orders',
  orderItem: 'order_items',
  server: 'servers',
  invoice: 'invoices',
  payment: 'payments',
  coinTransaction: 'coin_transactions',
  media: 'media',
  settings: 'settings',
  pterodactylPanel: 'pterodactyl_panels',
  coupon: 'coupons',
  referral: 'referrals',
  log: 'logs',
  notification: 'notifications',
};

const TABLES = MODELS;

// Relation map: model -> relation name -> { model, key, list }
const RELATIONS = {
  user: {
    servers: { model: 'server', key: 'userId', list: true },
    orders: { model: 'order', key: 'userId', list: true },
    invoices: { model: 'invoice', key: 'userId', list: true },
    payments: { model: 'payment', key: 'userId', list: true },
    coinTransactions: { model: 'coinTransaction', key: 'userId', list: true },
    referrals: { model: 'referral', key: 'referrerId', list: true },
    referredUsers: { model: 'user', key: 'referrerId', list: true },
  },
  order: {
    user: { model: 'user', key: 'userId', list: false },
    items: { model: 'orderItem', key: 'orderId', list: true },
    servers: { model: 'server', key: 'orderId', list: true },
    invoices: { model: 'invoice', key: 'orderId', list: true },
  },
  product: {
    orderItems: { model: 'orderItem', key: 'productId', list: true },
  },
  orderItem: {
    order: { model: 'order', key: 'orderId', list: false },
    product: { model: 'product', key: 'productId', list: false },
  },
  server: {
    user: { model: 'user', key: 'userId', list: false },
    order: { model: 'order', key: 'orderId', list: false },
  },
  invoice: {
    user: { model: 'user', key: 'userId', list: false },
    order: { model: 'order', key: 'orderId', list: false },
  },
  payment: {
    user: { model: 'user', key: 'userId', list: false },
  },
  coinTransaction: {
    user: { model: 'user', key: 'userId', list: false },
  },
  pterodactylPanel: {
    servers: { model: 'server', key: 'pteroPanelId', list: true },
  },
  referral: {
    referrer: { model: 'user', key: 'referrerId', list: false },
    referred: { model: 'user', key: 'referredId', list: false },
  },
};

// Columns per table (used for insert/update whitelisting and DDL)
const TABLE_COLUMNS = {
  user: ['id', 'username', 'email', 'password', 'avatar', 'discordId', 'role', 'coins', 'referrerId', 'referralCode', 'lastDailyReward', 'lastLoginReward', 'createdAt', 'updatedAt'],
  product: ['id', 'name', 'description', 'category', 'price', 'coinPrice', 'billingCycle', 'ram', 'cpu', 'disk', 'databases', 'backups', 'node', 'egg', 'allocation', 'enabled', 'createdAt', 'updatedAt'],
  order: ['id', 'userId', 'totalAmount', 'coinAmount', 'status', 'paymentMethod', 'paymentId', 'couponCode', 'createdAt', 'updatedAt'],
  orderItem: ['id', 'orderId', 'productId', 'quantity', 'price', 'coinPrice'],
  server: ['id', 'userId', 'orderId', 'pteroId', 'pteroPanelId', 'name', 'status', 'ram', 'cpu', 'disk', 'databases', 'backups', 'egg', 'node', 'expiresAt', 'suspendedAt', 'deletedAt', 'lastBackupAt', 'createdAt', 'updatedAt'],
  invoice: ['id', 'userId', 'orderId', 'amount', 'status', 'dueDate', 'paidAt', 'createdAt', 'updatedAt'],
  payment: ['id', 'userId', 'amount', 'method', 'status', 'transactionId', 'gatewayData', 'createdAt', 'updatedAt'],
  coinTransaction: ['id', 'userId', 'amount', 'balance', 'type', 'description', 'referenceId', 'createdAt'],
  media: ['id', 'filename', 'originalName', 'url', 'type', 'mimeType', 'size', 'uploadedBy', 'createdAt'],
  settings: ['id', 'key', 'value', 'category', 'updatedAt'],
  pterodactylPanel: ['id', 'name', 'url', 'appApiKey', 'clientApiKey', 'nodeId', 'eggId', 'locationId', 'enabled', 'lastChecked', 'status', 'createdAt', 'updatedAt'],
  coupon: ['id', 'code', 'type', 'value', 'maxUses', 'usedCount', 'expiresAt', 'minPurchase', 'applicableProducts', 'active', 'createdAt', 'updatedAt'],
  referral: ['id', 'referrerId', 'referredId', 'rewarded', 'createdAt'],
  log: ['id', 'action', 'userId', 'details', 'ipAddress', 'userAgent', 'createdAt'],
  notification: ['id', 'userId', 'title', 'message', 'type', 'read', 'actionUrl', 'createdAt'],
};

// Columns stored as ISO date strings, converted back to Date on read
const DATE_COLUMNS = {
  user: ['createdAt', 'updatedAt', 'lastDailyReward', 'lastLoginReward'],
  product: ['createdAt', 'updatedAt'],
  order: ['createdAt', 'updatedAt'],
  server: ['createdAt', 'updatedAt', 'expiresAt', 'suspendedAt', 'deletedAt', 'lastBackupAt'],
  invoice: ['createdAt', 'updatedAt', 'dueDate', 'paidAt'],
  payment: ['createdAt', 'updatedAt'],
  coinTransaction: ['createdAt'],
  media: ['createdAt'],
  settings: ['updatedAt'],
  pterodactylPanel: ['createdAt', 'updatedAt', 'lastChecked'],
  coupon: ['createdAt', 'updatedAt', 'expiresAt'],
  referral: ['createdAt'],
  log: ['createdAt'],
  notification: ['createdAt'],
};

// Columns stored as 0/1 integers, converted back to boolean on read
const BOOL_COLUMNS = {
  product: ['enabled'],
  pterodactylPanel: ['enabled'],
  coupon: ['active'],
  referral: ['rewarded'],
  notification: ['read'],
};

// Columns stored as JSON text, parsed back to objects on read
const JSON_COLUMNS = {
  payment: ['gatewayData'],
  settings: ['value'],
  log: ['details'],
  coupon: ['applicableProducts'],
};

// Numeric column -> SQL type
const NUMERIC_TYPES = {
  user: { coins: 'INTEGER' },
  product: { price: 'REAL', coinPrice: 'INTEGER', ram: 'INTEGER', cpu: 'INTEGER', disk: 'INTEGER', databases: 'INTEGER', backups: 'INTEGER' },
  order: { totalAmount: 'REAL', coinAmount: 'INTEGER' },
  orderItem: { quantity: 'INTEGER', price: 'REAL', coinPrice: 'INTEGER' },
  server: { ram: 'INTEGER', cpu: 'INTEGER', disk: 'INTEGER', databases: 'INTEGER', backups: 'INTEGER' },
  invoice: { amount: 'REAL' },
  payment: { amount: 'REAL' },
  coinTransaction: { amount: 'INTEGER', balance: 'INTEGER' },
  media: { size: 'INTEGER' },
  coupon: { value: 'REAL', maxUses: 'INTEGER', usedCount: 'INTEGER', minPurchase: 'REAL' },
};

const BOOLEAN_NAMES = ['enabled', 'active', 'rewarded', 'read'];

const createTableSql = (model) => {
  const table = TABLES[model];
  const cols = TABLE_COLUMNS[model];
  const numTypes = NUMERIC_TYPES[model] || {};
  const bools = BOOL_COLUMNS[model] || [];

  const defs = cols.map((col) => {
    if (col === 'id') return '"id" TEXT PRIMARY KEY';
    if (numTypes[col]) return `"${col}" ${numTypes[col]}`;
    if (bools.includes(col)) return `"${col}" INTEGER DEFAULT 0`;
    return `"${col}" TEXT`;
  });

  const unique = [];
  if (model === 'user') unique.push('email');
  if (model === 'settings') unique.push('key');
  if (model === 'coupon') unique.push('code');
  if (model === 'referral') unique.push('referredId');

  let sql = `CREATE TABLE IF NOT EXISTS "${table}" (${defs.join(', ')}`;
  if (unique.length) sql += `, ${unique.map((u) => `UNIQUE("${u}")`).join(', ')}`;
  sql += ')';
  return sql;
};

// Convert a JS value to its stored form
const toDbValue = (value) => {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object') {
    if (value.increment !== undefined && Object.keys(value).length === 1) {
      return Number(value.increment);
    }
    if (value.decrement !== undefined && Object.keys(value).length === 1) {
      return -Number(value.decrement);
    }
    return JSON.stringify(value);
  }
  return value;
};

// Convert a stored row back to a JS object
const fromRow = (model, row) => {
  if (!row) return null;
  const dates = DATE_COLUMNS[model] || [];
  const bools = BOOL_COLUMNS[model] || [];
  const jsons = JSON_COLUMNS[model] || [];
  const out = {};
  for (const col of Object.keys(row)) {
    let v = row[col];
    if (v === null || v === undefined) {
      out[col] = null;
      continue;
    }
    if (dates.includes(col)) v = new Date(v);
    else if (bools.includes(col)) v = v === 1 || v === true;
    else if (jsons.includes(col)) {
      try {
        v = JSON.parse(v);
      } catch {
        v = null;
      }
    }
    out[col] = v;
  }
  return out;
};

let raw = null;
let initialized = false;

export const getRawDb = () => {
  if (!raw) {
    const dbPath = process.env.DATABASE_PATH
      ? path.resolve(process.env.DATABASE_PATH)
      : path.resolve(__dirname, '../..', 'data', 'shp.db');

    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    raw = new DatabaseSync(dbPath);
    raw.exec('PRAGMA journal_mode = WAL;');
    initSchema();
  }
  return raw;
};

// Best-effort migration: add any columns missing on existing tables
const migrateSchema = () => {
  const db = getRawDb();
  for (const model of Object.keys(MODELS)) {
    const table = TABLES[model];
    const cols = TABLE_COLUMNS[model];
    const existing = db.prepare(`PRAGMA table_info("${table}")`).all().map((c) => c.name);
    const numTypes = NUMERIC_TYPES[model] || {};
    const bools = BOOL_COLUMNS[model] || [];
    for (const col of cols) {
      if (existing.includes(col)) continue;
      let type = 'TEXT';
      if (col === 'id') type = 'TEXT PRIMARY KEY';
      else if (numTypes[col]) type = numTypes[col];
      else if (bools.includes(col)) type = 'INTEGER DEFAULT 0';
      try {
        db.exec(`ALTER TABLE "${table}" ADD COLUMN "${col}" ${type}`);
      } catch (e) {
        // column may have been added concurrently - ignore
      }
    }
  }
};

const initSchema = () => {
  if (initialized) return;
  initialized = true;
  for (const model of Object.keys(MODELS)) {
    getRawDb().exec(createTableSql(model));
  }
  migrateSchema();
};

// Build a WHERE clause. Complex conditions (contains, OR) run in memory.
const buildWhere = (model, where) => {
  const clauses = [];
  const params = [];
  const memoryFilters = [];

  if (!where) return { sql: '', params, memoryFilters };

  for (const [field, cond] of Object.entries(where)) {
    if (field === 'OR') {
      memoryFilters.push((doc) => cond.some((sub) => docMatches(doc, sub)));
      continue;
    }

    if (cond !== null && typeof cond === 'object' && !Array.isArray(cond) && !(cond instanceof Date)) {
      for (const [op, val] of Object.entries(cond)) {
        switch (op) {
          case 'equals':
            clauses.push(`"${field}" = ?`);
            params.push(toDbValue(val));
            break;
          case 'not':
            if (val === null) {
              clauses.push(`"${field}" IS NOT NULL`);
            } else {
              clauses.push(`("${field}" IS NULL OR "${field}" != ?)`);
              params.push(toDbValue(val));
            }
            break;
          case 'in': {
            const arr = Array.isArray(val) ? val : [val];
            if (arr.length === 0) {
              clauses.push('0=1');
            } else {
              clauses.push(`"${field}" IN (${arr.map(() => '?').join(', ')})`);
              arr.forEach((v) => params.push(toDbValue(v)));
            }
            break;
          }
          case 'gt':
            clauses.push(`"${field}" > ?`);
            params.push(toDbValue(val));
            break;
          case 'gte':
            clauses.push(`"${field}" >= ?`);
            params.push(toDbValue(val));
            break;
          case 'lt':
            clauses.push(`"${field}" < ?`);
            params.push(toDbValue(val));
            break;
          case 'lte':
            clauses.push(`"${field}" <= ?`);
            params.push(toDbValue(val));
            break;
          case 'contains':
            memoryFilters.push((doc) =>
              String(doc[field] ?? '').toLowerCase().includes(String(val).toLowerCase())
            );
            break;
          case 'mode':
            break;
          default:
            clauses.push(`"${field}" = ?`);
            params.push(toDbValue(cond[op]));
        }
      }
    } else {
      if (cond === null) {
        clauses.push(`"${field}" IS NULL`);
      } else {
        clauses.push(`"${field}" = ?`);
        params.push(toDbValue(cond));
      }
    }
  }

  return { sql: clauses.join(' AND '), params, memoryFilters };
};

const docMatches = (doc, where) => {
  for (const [field, cond] of Object.entries(where)) {
    if (field === 'OR') {
      if (!cond.some((sub) => docMatches(doc, sub))) return false;
      continue;
    }
    if (cond !== null && typeof cond === 'object' && !Array.isArray(cond) && !(cond instanceof Date)) {
      for (const [op, val] of Object.entries(cond)) {
        switch (op) {
          case 'equals':
            if (doc[field] !== val) return false;
            break;
          case 'not':
            if (val === null ? doc[field] !== undefined && doc[field] !== null : doc[field] === val) return false;
            break;
          case 'in':
            if (!(Array.isArray(val) && val.includes(doc[field]))) return false;
            break;
          case 'gt':
            if ((doc[field] ?? null) === null || !(doc[field] > val)) return false;
            break;
          case 'gte':
            if ((doc[field] ?? null) === null || !(doc[field] >= val)) return false;
            break;
          case 'lt':
            if ((doc[field] ?? null) === null || !(doc[field] < val)) return false;
            break;
          case 'lte':
            if ((doc[field] ?? null) === null || !(doc[field] <= val)) return false;
            break;
          case 'contains':
            if (!String(doc[field] ?? '').toLowerCase().includes(String(val).toLowerCase())) return false;
            break;
          case 'mode':
            break;
          default:
            if (doc[field] !== cond[op]) return false;
        }
      }
    } else {
      if (cond === null ? doc[field] !== undefined && doc[field] !== null : doc[field] !== cond) return false;
    }
  }
  return true;
};

const sortDocs = (docs, orderBy) => {
  if (!orderBy) return docs;
  const [[field, dir]] = Object.entries(orderBy);
  const factor = dir === 'desc' ? -1 : 1;
  return docs.slice().sort((a, b) => {
    const av = a[field] instanceof Date ? a[field].getTime() : a[field];
    const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
    if (av === bv) return 0;
    return av > bv ? factor : -factor;
  });
};

const selectAll = (model, whereSql, params, orderBy, take, skip) => {
  let sql = `SELECT * FROM "${TABLES[model]}"`;
  if (whereSql) sql += ` WHERE ${whereSql}`;
  if (orderBy) {
    const [[field, dir]] = Object.entries(orderBy);
    sql += ` ORDER BY "${field}" ${dir === 'desc' ? 'DESC' : 'ASC'}`;
  }
  if (take !== undefined && take !== null) sql += ` LIMIT ${Number(take)}`;
  if (skip !== undefined && skip !== null) sql += ` OFFSET ${Number(skip)}`;
  return getRawDb().prepare(sql).all(...params);
};

// Resolve a select / include spec against a document.
async function resolveDoc(doc, model, spec, selectMode = false) {
  if (!spec) return doc;

  let out = selectMode ? {} : { ...doc };

  for (const [key, sub] of Object.entries(spec)) {
    if (key === '_count') {
      const counts = {};
      const countSpec = sub && sub.select ? sub.select : {};
      for (const [rel, enabled] of Object.entries(countSpec)) {
        const relDef = RELATIONS[model]?.[rel];
        counts[rel] = enabled && relDef ? await count(relDef.model, { where: { [relDef.key]: doc.id } }) : 0;
      }
      out._count = counts;
      continue;
    }

    if (key === 'select' || key === 'include' || key === 'orderBy' || key === 'take' || key === 'skip') {
      continue;
    }

    const relDef = RELATIONS[model]?.[key];
    if (!relDef) {
      if (selectMode) out[key] = doc[key];
      continue;
    }

    const nestedSpec = sub && sub.select ? sub.select : sub && sub.include ? sub.include : null;
    const nestedSelectMode = !!(sub && sub.select);

    if (relDef.list) {
      const relDocs = await findMany(relDef.model, {
        where: { [relDef.key]: doc.id },
        orderBy: sub && sub.orderBy ? sub.orderBy : undefined,
        take: sub && sub.take ? sub.take : undefined,
      });
      const resolved = await Promise.all(
        relDocs.map((d) => (nestedSpec ? resolveDoc(d, relDef.model, nestedSpec, nestedSelectMode) : d))
      );
      out[key] = resolved;
    } else {
      const relatedId = doc[relDef.key];
      if (!relatedId) {
        out[key] = null;
        continue;
      }
      const related = await findUnique(relDef.model, { where: { id: relatedId } });
      out[key] = related && nestedSpec ? await resolveDoc(related, relDef.model, nestedSpec, nestedSelectMode) : related;
    }
  }

  return out;
}

const findMany = async (model, { where, orderBy, take, skip, select, include } = {}) => {
  const { sql, params, memoryFilters } = buildWhere(model, where);

  let docs;
  if (memoryFilters.length > 0) {
    const rows = selectAll(model, sql, params);
    docs = rows.map((r) => fromRow(model, r)).filter((d) => memoryFilters.every((fn) => fn(d)));
    docs = sortDocs(docs, orderBy);
    if (skip) docs = docs.slice(skip);
    if (take) docs = docs.slice(0, take);
  } else {
    docs = selectAll(model, sql, params, orderBy, take, skip).map((r) => fromRow(model, r));
  }

  const spec = select || include;
  if (!spec) return docs;
  return Promise.all(docs.map((d) => resolveDoc(d, model, spec, !!select)));
};

const findFirst = async (model, args = {}) => {
  const docs = await findMany(model, { ...args, take: 1 });
  return docs[0] || null;
};

const findUnique = async (model, { where, select, include } = {}) => {
  if (!where) return null;

  if (Object.keys(where).length === 1 && where.id) {
    const row = getRawDb().prepare(`SELECT * FROM "${TABLES[model]}" WHERE "id" = ?`).get(where.id);
    if (!row) return null;
    const doc = fromRow(model, row);
    const spec = select || include;
    return spec ? resolveDoc(doc, model, spec, !!select) : doc;
  }

  const docs = await findMany(model, { where, select, include, take: 1 });
  return docs[0] || null;
};

const count = async (model, { where } = {}) => {
  const { sql, params, memoryFilters } = buildWhere(model, where);

  if (memoryFilters.length > 0) {
    const rows = getRawDb().prepare(`SELECT * FROM "${TABLES[model]}" WHERE ${sql || '1=1'}`).all(...params);
    return rows.map((r) => fromRow(model, r)).filter((d) => memoryFilters.every((fn) => fn(d))).length;
  }

  const row = getRawDb().prepare(`SELECT COUNT(*) AS c FROM "${TABLES[model]}" WHERE ${sql || '1=1'}`).get(...params);
  return Number(row.c);
};

const create = async (model, { data, include, select } = {}) => {
  const cols = TABLE_COLUMNS[model];
  const now = new Date();

  const nested = {};
  const payload = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && v.create) {
      nested[k] = v;
    } else if (cols.includes(k)) {
      payload[k] = v;
    }
  }

  const id = model === 'settings' && payload.key ? String(payload.key) : randomUUID();
  payload.id = id;
  if (cols.includes('createdAt') && !payload.createdAt) payload.createdAt = now;
  if (cols.includes('updatedAt') && !payload.updatedAt) payload.updatedAt = now;

  const insertCols = [];
  const insertParams = [];
  for (const col of cols) {
    if (payload[col] === undefined) continue;
    insertCols.push(`"${col}"`);
    insertParams.push(toDbValue(payload[col]));
  }

  getRawDb()
    .prepare(`INSERT INTO "${TABLES[model]}" (${insertCols.join(', ')}) VALUES (${insertParams.map(() => '?').join(', ')})`)
    .run(...insertParams);

  for (const [k, spec] of Object.entries(nested)) {
    const relDef = RELATIONS[model]?.[k];
    if (relDef && spec.create) {
      await create(relDef.model, { data: { ...spec.create, [relDef.key]: id } });
    }
  }

  const row = getRawDb().prepare(`SELECT * FROM "${TABLES[model]}" WHERE "id" = ?`).get(id);
  const doc = fromRow(model, row);
  const outSpec = select || include;
  return outSpec ? resolveDoc(doc, model, outSpec, !!select) : doc;
};

const getDocId = async (model, where) => {
  if (where && where.id) return where.id;
  const found = await findMany(model, { where, take: 1 });
  return found[0]?.id || null;
};

const update = async (model, { where, data } = {}) => {
  const id = await getDocId(model, where);
  if (!id) throw new Error(`${model} not found`);

  const cols = TABLE_COLUMNS[model];
  const newData = { ...data };
  if (cols.includes('updatedAt')) newData.updatedAt = new Date();

  const sets = [];
  const params = [];
  for (const [k, v] of Object.entries(newData)) {
    if (!cols.includes(k)) continue;
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && Object.keys(v).length === 1 && v.increment !== undefined) {
      sets.push(`"${k}" = COALESCE("${k}", 0) + ?`);
      params.push(Number(v.increment));
    } else if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && Object.keys(v).length === 1 && v.decrement !== undefined) {
      sets.push(`"${k}" = COALESCE("${k}", 0) - ?`);
      params.push(Number(v.decrement));
    } else {
      sets.push(`"${k}" = ?`);
      params.push(toDbValue(v));
    }
  }

  if (sets.length > 0) {
    params.push(id);
    getRawDb().prepare(`UPDATE "${TABLES[model]}" SET ${sets.join(', ')} WHERE "id" = ?`).run(...params);
  }

  const row = getRawDb().prepare(`SELECT * FROM "${TABLES[model]}" WHERE "id" = ?`).get(id);
  return fromRow(model, row);
};

const updateMany = async (model, { where, data } = {}) => {
  const docs = await findMany(model, { where, select: { id: true } });
  for (const d of docs) {
    await update(model, { where: { id: d.id }, data });
  }
  return { count: docs.length };
};

const remove = async (model, { where } = {}) => {
  const id = await getDocId(model, where);
  if (!id) return;
  getRawDb().prepare(`DELETE FROM "${TABLES[model]}" WHERE "id" = ?`).run(id);
};

const upsert = async (model, { where, update: updateData, create: createData } = {}) => {
  const existing = await findUnique(model, { where });
  if (existing) return update(model, { where, data: updateData });
  return create(model, { data: { ...where, ...createData } });
};

const aggregate = async (model, { where, _sum } = {}) => {
  const docs = await findMany(model, { where });
  const result = {};
  for (const [field, enabled] of Object.entries(_sum || {})) {
    result[field] = enabled ? docs.reduce((acc, d) => acc + (Number(d[field]) || 0), 0) : null;
  }
  return { _sum: result };
};

// Prisma-like model proxies so route code reads naturally
const db = {};
for (const model of Object.keys(MODELS)) {
  db[model] = {
    findUnique: (args) => findUnique(model, args),
    findFirst: (args) => findFirst(model, args),
    findMany: (args) => findMany(model, args),
    count: (args) => count(model, args),
    create: (args) => create(model, args),
    update: (args) => update(model, args),
    updateMany: (args) => updateMany(model, args),
    delete: (args) => remove(model, args),
    upsert: (args) => upsert(model, args),
    aggregate: (args) => aggregate(model, args),
  };
}

db.$connect = async () => {
  try {
    getRawDb();
    return true;
  } catch (error) {
    console.error('SQLite connection failed:', error);
    return false;
  }
};

db.$disconnect = async () => {
  try {
    if (raw) raw.close();
  } catch {
    // ignore
  }
  return true;
};

export { db };
