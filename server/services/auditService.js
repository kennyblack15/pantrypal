const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  userId: { type: String },
  action: { type: String, required: true },
  resource: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  status: { type: String },
  changes: {
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed }
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

class AuditService {
  constructor() {
    this.setupLogger();
    this.sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
  }

  setupLogger() {
    const logDir = path.join(__dirname, '../logs/audit');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logger = createLogger({
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new transports.File({
          filename: path.join(logDir, 'audit.log'),
          level: 'info'
        })
      ]
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      }));
    }
  }

  async logAction(auditData) {
    try {
      const {
        userId,
        action,
        resource,
        details,
        ip,
        userAgent,
        status,
        changes
      } = auditData;

      // Sanitize sensitive data
      const sanitizedDetails = this.sanitizeSensitiveData(details);
      const sanitizedChanges = changes ? {
        before: this.sanitizeSensitiveData(changes.before),
        after: this.sanitizeSensitiveData(changes.after)
      } : undefined;

      // Create audit log entry
      const auditLog = new AuditLog({
        timestamp: new Date(),
        userId,
        action,
        resource,
        details: sanitizedDetails,
        ip,
        userAgent,
        status,
        changes: sanitizedChanges
      });

      // Save to database
      await auditLog.save();

      // Log to file
      this.logger.info({
        timestamp: auditLog.timestamp,
        userId,
        action,
        resource,
        details: sanitizedDetails,
        ip,
        status
      });

      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  sanitizeSensitiveData(data) {
    if (!data) return data;

    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const key of Object.keys(sanitized)) {
        if (this.sensitiveFields.includes(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeSensitiveData(sanitized[key]);
        }
      }
      return sanitized;
    }

    return data;
  }

  async queryAuditLogs(query) {
    try {
      const {
        startDate,
        endDate,
        userId,
        action,
        resource,
        status,
        page = 1,
        limit = 50
      } = query;

      const filter = {};

      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      if (userId) filter.userId = userId;
      if (action) filter.action = action;
      if (resource) filter.resource = resource;
      if (status) filter.status = status;

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit),
        AuditLog.countDocuments(filter)
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error querying audit logs:', error);
      throw error;
    }
  }

  async generateAuditReport(query) {
    try {
      const { logs } = await this.queryAuditLogs(query);

      const report = {
        period: {
          start: query.startDate,
          end: query.endDate
        },
        summary: {
          totalActions: logs.length,
          byAction: {},
          byResource: {},
          byStatus: {},
          byUser: {}
        },
        details: logs
      };

      // Generate summary statistics
      logs.forEach(log => {
        // Count by action
        report.summary.byAction[log.action] = (report.summary.byAction[log.action] || 0) + 1;

        // Count by resource
        if (log.resource) {
          report.summary.byResource[log.resource] = (report.summary.byResource[log.resource] || 0) + 1;
        }

        // Count by status
        report.summary.byStatus[log.status] = (report.summary.byStatus[log.status] || 0) + 1;

        // Count by user
        if (log.userId) {
          report.summary.byUser[log.userId] = (report.summary.byUser[log.userId] || 0) + 1;
        }
      });

      return report;
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  async exportAuditLogs(query, format = 'json') {
    try {
      const { logs } = await this.queryAuditLogs(query);

      switch (format.toLowerCase()) {
        case 'csv':
          return this.exportToCSV(logs);
        case 'pdf':
          return this.exportToPDF(logs);
        case 'json':
        default:
          return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  exportToCSV(logs) {
    // Implement CSV export
    return '';
  }

  exportToPDF(logs) {
    // Implement PDF export
    return Buffer.from('');
  }
}

module.exports = new AuditService();
