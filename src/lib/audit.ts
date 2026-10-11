import { prisma } from "./db";

export interface CreateAuditLogParams {
  adminUserId: string;
  action: string;
  targetType: "USER" | "REPORT" | "EVENT" | "PAYMENT" | "VERIFICATION_REQUEST" | "SYSTEM";
  targetId: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
}

/**
 * Persists an immutable administrative audit log record in PostgreSQL.
 */
export async function logAdminAction(params: CreateAuditLogParams): Promise<void> {
  try {
    const detailsString =
      typeof params.details === "object"
        ? JSON.stringify(params.details)
        : params.details ?? null;

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: detailsString,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("CRITICAL: Failed to write admin audit log:", error, params);
    // In production, an alert should be raised if audit log persistence fails
  }
}
