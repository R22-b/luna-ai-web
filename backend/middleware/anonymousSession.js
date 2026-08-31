const crypto = require('crypto');
const { getMasterKey, isValidSessionId } = require('../services/settings-store');

const COOKIE_NAME = 'luna_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function sign(sessionId) {
  return crypto.createHmac('sha256', getMasterKey()).update(sessionId).digest('base64url');
}

function createToken() {
  const sessionId = crypto.randomBytes(32).toString('base64url');
  return `${sessionId}.${sign(sessionId)}`;
}

function getSessionIdFromRequest(req) {
  const cookies = String(req.headers.cookie || '').split(';').reduce((result, item) => {
    const index = item.indexOf('=');
    if (index === -1) return result;
    result[item.slice(0, index).trim()] = decodeURIComponent(item.slice(index + 1).trim());
    return result;
  }, {});
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const [sessionId, signature] = token.split('.');
  if (!isValidSessionId(sessionId) || !signature) return null;
  const expected = sign(sessionId);
  const valid = signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  return valid ? sessionId : null;
}

function setSessionCookie(res, sessionId, token) {
  const crossOriginDeployment = process.env.NODE_ENV === 'production' && Boolean(process.env.FRONTEND_URL);
  const sameSite = crossOriginDeployment ? 'None' : 'Lax';
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const value = token || `${sessionId}.${sign(sessionId)}`;
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; HttpOnly; SameSite=${sameSite}${secure}`);
}

function getOrCreateSessionId(req, res) {
  const existing = getSessionIdFromRequest(req);
  if (existing) return existing;
  const token = createToken();
  const sessionId = token.split('.')[0];
  setSessionCookie(res, sessionId, token);
  return sessionId;
}

function anonymousSession(req, res, next) {
  req.lunaSessionId = getOrCreateSessionId(req, res);
  next();
}

module.exports = { COOKIE_NAME, anonymousSession, getOrCreateSessionId, getSessionIdFromRequest, setSessionCookie };
