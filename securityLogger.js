// securityLogger.js
// DRM 백엔드용 구조화 보안 이벤트 로거 (ECS - Elastic Common Schema 정렬)
// JSON 한 줄 = 이벤트 하나. stdout(개발 확인)과 파일(SIEM이 tail)로 동시 출력.

const fs = require('fs');
const path = require('path');
const os = require('os');

// ──────────────────────────────────────────────────────────────
// 1) 이벤트 분류(taxonomy)
//    탐지 룰이 여기 action 값들로 걸린다. 새 이벤트가 필요하면 여기에만 추가.
//    category 값은 ECS event.category 권장값을 따름.
// ──────────────────────────────────────────────────────────────
const SecurityEvent = {
  LOGIN_SUCCESS:     { action: 'auth.login.success',     category: 'authentication',      outcome: 'success' },
  LOGIN_FAILURE:     { action: 'auth.login.failure',     category: 'authentication',      outcome: 'failure' },
  LOGOUT:            { action: 'auth.logout',            category: 'authentication',      outcome: 'success' },

  LICENSE_ISSUED:    { action: 'license.issued',         category: 'iam',                 outcome: 'success' },
  LICENSE_DENIED:    { action: 'license.denied',         category: 'iam',                 outcome: 'failure' },
  EXPIRED_ACCESS:    { action: 'license.expired_access', category: 'iam',                 outcome: 'failure' },

  DOC_VIEW:          { action: 'doc.view',               category: 'file',                outcome: 'success' },
  DOC_DOWNLOAD:      { action: 'doc.download',            category: 'file',                outcome: 'success' },
  DOC_ACCESS_DENIED: { action: 'doc.access.denied',      category: 'file',                outcome: 'failure' },

  TAMPER_DEVTOOLS:   { action: 'tamper.devtools',        category: 'intrusion_detection', outcome: 'unknown' },
};

// ──────────────────────────────────────────────────────────────
// 2) 출력 대상: 콘솔 + 파일 (logs/security.log)
//    Wazuh/Splunk는 이 파일을 tail 해서 수집한다(Week 2).
// ──────────────────────────────────────────────────────────────
const LOG_DIR = process.env.SEC_LOG_DIR || path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'security.log');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ──────────────────────────────────────────────────────────────
// 3) 핵심: 이벤트 정의 + 컨텍스트 → ECS 정렬 JSON 레코드 생성/출력
// ──────────────────────────────────────────────────────────────
function emit(eventDef, ctx = {}) {
  const record = {
    '@timestamp': new Date().toISOString(),   // ISO8601, UTC, ms 정밀도 (시간창 룰의 기준)
    event: {
      kind: 'event',
      category: eventDef.category,
      action: eventDef.action,
      outcome: eventDef.outcome,
    },
    user: {
      name: ctx.user || null,
      id: ctx.userId || null,
    },
    source: { ip: ctx.ip || null },
    user_agent: { original: ctx.userAgent || null },
    drm: {                                     // 앱 고유 필드는 별도 네임스페이스에
      doc_id: ctx.docId || null,
      license_id: ctx.licenseId || null,
      reason: ctx.reason || null,
    },
    labels: {
      app: 'drm-backend',
      env: process.env.NODE_ENV || 'lab',
      host: os.hostname(),
    },
    message: ctx.message || eventDef.action,   // 사람이 읽는 요약(트리아지용)
  };

  const line = JSON.stringify(record);
  process.stdout.write(line + '\n');                  // 개발 중 즉시 확인
  fs.appendFile(LOG_FILE, line + '\n', () => {});     // SIEM 수집용 (비동기, 실패해도 앱 안 죽게)
  return record;
}

// ──────────────────────────────────────────────────────────────
// 4) Express req에서 IP/User-Agent 뽑기 (프록시 뒤면 X-Forwarded-For 우선)
// ──────────────────────────────────────────────────────────────
function fromRequest(req) {
  const xff = req.headers['x-forwarded-for'];
  const ip = (xff ? xff.split(',')[0].trim() : null)
    || req.ip
    || (req.connection && req.connection.remoteAddress)
    || null;
  return { ip, userAgent: req.headers['user-agent'] || null };
}

// ──────────────────────────────────────────────────────────────
// 5) 호출부를 깔끔하게 — 타입별 헬퍼
//    라우트에서는 sec.logLoginFailure({...}) 처럼만 부르면 됨.
// ──────────────────────────────────────────────────────────────
module.exports = {
  SecurityEvent,
  fromRequest,
  emit,
  logLoginSuccess:   (ctx) => emit(SecurityEvent.LOGIN_SUCCESS, ctx),
  logLoginFailure:   (ctx) => emit(SecurityEvent.LOGIN_FAILURE, ctx),
  logLogout:         (ctx) => emit(SecurityEvent.LOGOUT, ctx),
  logLicenseIssued:  (ctx) => emit(SecurityEvent.LICENSE_ISSUED, ctx),
  logLicenseDenied:  (ctx) => emit(SecurityEvent.LICENSE_DENIED, ctx),
  logExpiredAccess:  (ctx) => emit(SecurityEvent.EXPIRED_ACCESS, ctx),
  logDocView:        (ctx) => emit(SecurityEvent.DOC_VIEW, ctx),
  logDocDownload:    (ctx) => emit(SecurityEvent.DOC_DOWNLOAD, ctx),
  logDocDenied:      (ctx) => emit(SecurityEvent.DOC_ACCESS_DENIED, ctx),
  logTamperDevtools: (ctx) => emit(SecurityEvent.TAMPER_DEVTOOLS, ctx),
};
