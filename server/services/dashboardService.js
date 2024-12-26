const WebSocket = require('ws');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const securityMonitorService = require('./securityMonitorService');
const threatDetectionService = require('./threatDetectionService');

class DashboardService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    });
    
    this.metrics = {
      activeUsers: 0,
      requestsPerMinute: 0,
      averageResponseTime: 0,
      errorRate: 0,
      threatLevel: 'low'
    };

    this.initialize();
  }

  initialize() {
    this.setupWebSocket();
    this.startMetricsCollection();
    this.subscribeToEvents();
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: process.env.DASHBOARD_WS_PORT || 8080 });

    this.wss.on('connection', (ws) => {
      console.log('Dashboard client connected');
      
      // Send initial state
      ws.send(JSON.stringify({
        type: 'initial_state',
        data: this.metrics
      }));

      // Handle client messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error handling client message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Dashboard client disconnected');
      });
    });
  }

  async handleClientMessage(ws, message) {
    switch (message.type) {
      case 'get_metrics':
        ws.send(JSON.stringify({
          type: 'metrics_update',
          data: await this.getDetailedMetrics()
        }));
        break;

      case 'get_threats':
        ws.send(JSON.stringify({
          type: 'threats_update',
          data: await this.getRecentThreats()
        }));
        break;

      case 'get_audit_logs':
        ws.send(JSON.stringify({
          type: 'audit_logs_update',
          data: await this.getRecentAuditLogs()
        }));
        break;

      case 'block_ip':
        await this.blockIP(message.data.ip);
        this.broadcastUpdate('ip_blocked', { ip: message.data.ip });
        break;
    }
  }

  startMetricsCollection() {
    // Collect metrics every 5 seconds
    setInterval(async () => {
      await this.updateMetrics();
      this.broadcastMetrics();
    }, 5000);

    // Generate detailed reports every minute
    setInterval(async () => {
      await this.generateDetailedReport();
    }, 60000);
  }

  subscribeToEvents() {
    // Subscribe to security events
    this.redis.subscribe('security_events', (err, count) => {
      if (err) {
        console.error('Error subscribing to security events:', err);
        return;
      }
    });

    this.redis.on('message', async (channel, message) => {
      try {
        const event = JSON.parse(message);
        await this.handleSecurityEvent(event);
      } catch (error) {
        console.error('Error handling security event:', error);
      }
    });
  }

  async updateMetrics() {
    try {
      // Update active users
      this.metrics.activeUsers = await this.getActiveUsers();

      // Update requests per minute
      this.metrics.requestsPerMinute = await this.getRequestRate();

      // Update average response time
      this.metrics.averageResponseTime = await this.getAverageResponseTime();

      // Update error rate
      this.metrics.errorRate = await this.getErrorRate();

      // Update threat level
      this.metrics.threatLevel = await this.calculateThreatLevel();

      // Store metrics history
      await this.storeMetricsHistory();
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  broadcastMetrics() {
    this.broadcast({
      type: 'metrics_update',
      data: this.metrics
    });
  }

  broadcast(data) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  async getDetailedMetrics() {
    return {
      ...this.metrics,
      topEndpoints: await this.getTopEndpoints(),
      geographicDistribution: await this.getGeographicDistribution(),
      resourceUsage: await this.getResourceUsage(),
      securityIncidents: await this.getSecurityIncidents()
    };
  }

  async getRecentThreats() {
    // Get threats from the last 24 hours
    const threats = await securityMonitorService.getRecentThreats(24);
    return threats.map(threat => ({
      ...threat,
      analysis: threatDetectionService.analyzeRequest(threat.request)
    }));
  }

  async getRecentAuditLogs() {
    // Get audit logs from the last hour
    return await mongoose.model('AuditLog')
      .find({
        timestamp: { $gte: new Date(Date.now() - 3600000) }
      })
      .sort({ timestamp: -1 })
      .limit(100);
  }

  async blockIP(ip) {
    await threatDetectionService.blockIP(ip);
    await securityMonitorService.logSecurityEvent({
      type: 'ip_blocked',
      ip,
      details: { source: 'dashboard' }
    });
  }

  async generateDetailedReport() {
    const report = {
      timestamp: new Date(),
      metrics: this.metrics,
      analysis: {
        trends: await this.analyzeTrends(),
        anomalies: await this.detectAnomalies(),
        recommendations: await this.generateRecommendations()
      },
      security: {
        threats: await this.getRecentThreats(),
        incidents: await this.getSecurityIncidents(),
        riskAssessment: await this.assessRisk()
      }
    };

    // Store report
    await this.storeReport(report);

    // Broadcast if significant changes
    if (this.isSignificantChange(report)) {
      this.broadcast({
        type: 'detailed_report',
        data: report
      });
    }
  }

  // Helper methods
  async getActiveUsers() {
    return await this.redis.scard('active_users');
  }

  async getRequestRate() {
    const requests = await this.redis.llen('recent_requests');
    return requests / 60; // requests per minute
  }

  async getAverageResponseTime() {
    const times = await this.redis.lrange('response_times', 0, -1);
    return times.reduce((a, b) => a + parseInt(b), 0) / times.length;
  }

  async getErrorRate() {
    const errors = await this.redis.get('error_count');
    const total = await this.redis.get('request_count');
    return (errors / total) * 100;
  }

  async calculateThreatLevel() {
    const threats = await this.getRecentThreats();
    const score = threats.reduce((acc, threat) => acc + threat.severity, 0);
    
    if (score > 100) return 'critical';
    if (score > 50) return 'high';
    if (score > 20) return 'medium';
    return 'low';
  }

  async getTopEndpoints() {
    return await this.redis.zrevrange('endpoint_hits', 0, 9, 'WITHSCORES');
  }

  async getGeographicDistribution() {
    return await this.redis.hgetall('geo_distribution');
  }

  async getResourceUsage() {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  async getSecurityIncidents() {
    return await mongoose.model('SecurityIncident')
      .find({
        timestamp: { $gte: new Date(Date.now() - 86400000) }
      })
      .sort({ severity: -1 });
  }

  async analyzeTrends() {
    // Implement trend analysis
    return {};
  }

  async detectAnomalies() {
    // Implement anomaly detection
    return {};
  }

  async generateRecommendations() {
    // Implement recommendations generation
    return [];
  }

  async assessRisk() {
    // Implement risk assessment
    return {};
  }

  async storeReport(report) {
    await this.redis.lpush('dashboard_reports', JSON.stringify(report));
    await this.redis.ltrim('dashboard_reports', 0, 99); // Keep last 100 reports
  }

  isSignificantChange(report) {
    // Implement change significance detection
    return true;
  }
}

module.exports = new DashboardService();
