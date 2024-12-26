const tf = require('@tensorflow/tfjs-node');
const geoip = require('maxmind');
const { OpenAI } = require('openai');
const Redis = require('ioredis');
const securityMonitorService = require('./securityMonitorService');

class ThreatDetectionService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    });
    this.initializeAIModel();
  }

  async initializeAIModel() {
    // Load pre-trained model for anomaly detection
    this.model = await tf.loadLayersModel('file://./models/threat-detection/model.json');
    this.geoipReader = await geoip.open('./data/GeoLite2-City.mmdb');
  }

  async analyzeRequest(req) {
    const features = await this.extractFeatures(req);
    const threatScore = await this.calculateThreatScore(features);
    const anomalyScore = await this.detectAnomalies(features);
    const geoipData = await this.analyzeGeoIP(req.ip);

    const analysis = {
      threatScore,
      anomalyScore,
      geoipData,
      patterns: await this.detectPatterns(req),
      botProbability: await this.detectBot(req),
      riskFactors: await this.identifyRiskFactors(features)
    };

    if (this.isHighRisk(analysis)) {
      await this.triggerThreatResponse(analysis, req);
    }

    return analysis;
  }

  async extractFeatures(req) {
    const userAgent = req.headers['user-agent'];
    const requestData = {
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body,
      ip: req.ip,
      timestamp: Date.now()
    };

    // Get historical data for this IP
    const history = await this.getRequestHistory(req.ip);

    return {
      requestData,
      userAgent,
      history,
      timing: {
        timeBetweenRequests: this.calculateTimingFeatures(history),
        requestDuration: this.calculateRequestDuration(req)
      },
      patterns: {
        repeatPatterns: this.findRepeatPatterns(history),
        accessPatterns: this.analyzeAccessPatterns(history)
      }
    };
  }

  async calculateThreatScore(features) {
    // Convert features to tensor
    const tensor = this.featuresToTensor(features);
    
    // Get model prediction
    const prediction = this.model.predict(tensor);
    const threatScore = prediction.dataSync()[0];

    // Enhance with AI analysis
    const aiAnalysis = await this.getAIThreatAnalysis(features);
    
    return {
      score: threatScore,
      aiAnalysis,
      confidence: prediction.dataSync()[1]
    };
  }

  async getAIThreatAnalysis(features) {
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are a security expert analyzing potential threats in web traffic."
        }, {
          role: "user",
          content: `Analyze this request pattern for potential security threats: ${JSON.stringify(features)}`
        }],
        temperature: 0.3,
        max_tokens: 150
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting AI threat analysis:', error);
      return null;
    }
  }

  async detectAnomalies(features) {
    const recentActivity = await this.getRecentActivity(features.requestData.ip);
    const normalPatterns = await this.getNormalPatterns();
    
    return {
      timingAnomalies: this.detectTimingAnomalies(recentActivity),
      behaviorAnomalies: this.detectBehaviorAnomalies(features, normalPatterns),
      patternAnomalies: this.detectPatternAnomalies(features.patterns)
    };
  }

  async analyzeGeoIP(ip) {
    try {
      const geoData = this.geoipReader.city(ip);
      const vpnDetection = await this.detectVPN(ip);
      
      return {
        country: geoData.country.isoCode,
        city: geoData.city.names.en,
        coordinates: [geoData.location.latitude, geoData.location.longitude],
        vpn: vpnDetection,
        risk: await this.assessLocationRisk(geoData)
      };
    } catch (error) {
      console.error('Error analyzing GeoIP:', error);
      return null;
    }
  }

  async detectBot(req) {
    const features = [
      this.analyzeUserAgent(req.headers['user-agent']),
      this.checkRequestPatterns(req),
      this.analyzeTimingPatterns(req),
      await this.checkKnownBotSignatures(req)
    ];

    return {
      isBot: this.calculateBotProbability(features) > 0.7,
      confidence: this.calculateBotProbability(features),
      signatures: features
    };
  }

  async identifyRiskFactors(features) {
    const riskFactors = [];

    // Check for known attack patterns
    if (this.matchesAttackPattern(features)) {
      riskFactors.push({
        type: 'attack_pattern',
        severity: 'high',
        details: await this.getAttackDetails(features)
      });
    }

    // Check for suspicious behavior
    if (this.hasSuspiciousBehavior(features)) {
      riskFactors.push({
        type: 'suspicious_behavior',
        severity: 'medium',
        details: await this.getBehaviorDetails(features)
      });
    }

    // Rate limiting violations
    if (await this.checkRateLimiting(features.requestData.ip)) {
      riskFactors.push({
        type: 'rate_limit',
        severity: 'medium',
        details: await this.getRateLimitDetails(features.requestData.ip)
      });
    }

    return riskFactors;
  }

  async triggerThreatResponse(analysis, req) {
    // Log threat
    await securityMonitorService.logSecurityEvent({
      type: 'threat_detected',
      severity: 'high',
      details: analysis
    });

    // Block IP if necessary
    if (analysis.threatScore > 0.8) {
      await this.blockIP(req.ip);
    }

    // Notify security team
    await this.notifySecurityTeam(analysis);

    // Update security rules
    await this.updateSecurityRules(analysis);
  }

  // Helper methods
  async getRequestHistory(ip) {
    return await this.redis.lrange(`request_history:${ip}`, 0, -1);
  }

  calculateTimingFeatures(history) {
    // Implement timing analysis
    return {};
  }

  calculateRequestDuration(req) {
    return Date.now() - req._startTime;
  }

  findRepeatPatterns(history) {
    // Implement pattern detection
    return [];
  }

  analyzeAccessPatterns(history) {
    // Implement access pattern analysis
    return {};
  }

  featuresToTensor(features) {
    // Convert features to tensor format
    return tf.tensor([]);
  }

  async detectVPN(ip) {
    // Implement VPN detection
    return false;
  }

  async assessLocationRisk(geoData) {
    // Implement location risk assessment
    return 'low';
  }

  analyzeUserAgent(userAgent) {
    // Implement user agent analysis
    return {};
  }

  checkRequestPatterns(req) {
    // Implement request pattern checking
    return {};
  }

  analyzeTimingPatterns(req) {
    // Implement timing pattern analysis
    return {};
  }

  async checkKnownBotSignatures(req) {
    // Implement bot signature checking
    return {};
  }

  calculateBotProbability(features) {
    // Implement bot probability calculation
    return 0;
  }

  matchesAttackPattern(features) {
    // Implement attack pattern matching
    return false;
  }

  hasSuspiciousBehavior(features) {
    // Implement suspicious behavior detection
    return false;
  }

  async checkRateLimiting(ip) {
    // Implement rate limiting check
    return false;
  }

  async getAttackDetails(features) {
    // Implement attack details retrieval
    return {};
  }

  async getBehaviorDetails(features) {
    // Implement behavior details retrieval
    return {};
  }

  async getRateLimitDetails(ip) {
    // Implement rate limit details retrieval
    return {};
  }

  async blockIP(ip) {
    // Implement IP blocking
    return true;
  }

  async notifySecurityTeam(analysis) {
    // Implement security team notification
    return true;
  }

  async updateSecurityRules(analysis) {
    // Implement security rules update
    return true;
  }
}

module.exports = new ThreatDetectionService();
