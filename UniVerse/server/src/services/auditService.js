import { AdminAuditLog } from '../models/AdminAuditLog.js';

export const logAudit = async ({
  req = null,
  actorId,
  action,
  targetType,
  targetId = null,
  description,
  metadata = {},
}) => {
  try {
    let ipAddress = '';
    if (req) {
      ipAddress =
        req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        '';
    }

    const logEntry = await AdminAuditLog.create({
      actor: actorId,
      action,
      targetType,
      targetId,
      description,
      metadata,
      ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '',
    });

    return logEntry;
  } catch (error) {
    console.error('[AuditService] Failed to record audit log:', error.message);
    return null;
  }
};
