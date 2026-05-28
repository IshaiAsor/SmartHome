import db from '../config/db';

export class AuditRepository {
  async logLogin(userId: number, ipAddress: string) {
    await db.userLoginAudit.create({ data: { user_id: userId, ip_address: ipAddress } });
  }
}

export const auditRepository = new AuditRepository();
