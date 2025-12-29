interface AuditLog {
    id: string;
    action: string;
    userId: string;
    timestamp: Date;
    details: Record<string, unknown>;
    status: 'success' | 'failure';
}

class AuditService {
    private logs: AuditLog[] = [];

    log(action: string, userId: string, details: Record<string, unknown>, status: 'success' | 'failure' = 'success'): void {
        const auditLog: AuditLog = {
            id: this.generateId(),
            action,
            userId,
            timestamp: new Date(),
            details,
            status,
        };
        this.logs.push(auditLog);
    }

    getLogs(userId?: string): AuditLog[] {
        return userId ? this.logs.filter(log => log.userId === userId) : this.logs;
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

export type { AuditService, AuditLog };