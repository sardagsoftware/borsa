// ============================================================================
// AILYDIAN - Monitoring & Telemetry Service Tests
// ============================================================================

const {
  MonitoringTelemetryService,
  monitoringService,
  trackError,
  trackMessage,
  trackMetric,
  getHealth,
} = require('../../services/monitoring-telemetry-service');

describe('MonitoringTelemetryService', () => {
  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('Initialization', () => {
    it('should create a singleton instance', () => {
      expect(monitoringService).toBeInstanceOf(MonitoringTelemetryService);
      expect(monitoringService.isInitialized).toBe(false);
    });

    it('should initialize without errors (no credentials)', () => {
      // Should not throw even without credentials
      expect(() => {
        monitoringService.initialize();
      }).not.toThrow();

      expect(monitoringService.isInitialized).toBe(true);
    });

    it('should not re-initialize if already initialized', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      monitoringService.initialize();
      monitoringService.initialize(); // Second call

      expect(consoleSpy).toHaveBeenCalledWith('⚠️  Monitoring already initialized');

      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Error Tracking Tests
  // ==========================================================================

  describe('Error Tracking', () => {
    it('should track errors with context', () => {
      const error = new Error('Test error');
      const context = { userId: 'test-user', action: 'test-action' };

      // Should not throw
      expect(() => {
        monitoringService.trackError(error, context);
      }).not.toThrow();
    });

    it('should track errors without context', () => {
      const error = new Error('Simple error');

      expect(() => {
        monitoringService.trackError(error);
      }).not.toThrow();
    });

    it('should use convenience function trackError', () => {
      const error = new Error('Convenience error');

      expect(() => {
        trackError(error, { test: true });
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Message Tracking Tests
  // ==========================================================================

  describe('Message Tracking', () => {
    it('should track info messages', () => {
      expect(() => {
        monitoringService.trackMessage('Info message', 'info', { foo: 'bar' });
      }).not.toThrow();
    });

    it('should track warning messages', () => {
      expect(() => {
        monitoringService.trackMessage('Warning message', 'warning');
      }).not.toThrow();
    });

    it('should track error messages', () => {
      expect(() => {
        monitoringService.trackMessage('Error message', 'error');
      }).not.toThrow();
    });

    it('should use convenience function trackMessage', () => {
      expect(() => {
        trackMessage('Convenience message', 'info', { test: true });
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Metric Tracking Tests
  // ==========================================================================

  describe('Metric Tracking', () => {
    it('should track custom metrics', () => {
      expect(() => {
        monitoringService.trackMetric('test.metric', 42, { unit: 'ms' });
      }).not.toThrow();
    });

    it('should track metrics without properties', () => {
      expect(() => {
        monitoringService.trackMetric('simple.metric', 100);
      }).not.toThrow();
    });

    it('should use convenience function trackMetric', () => {
      expect(() => {
        trackMetric('convenience.metric', 50);
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Request Tracking Tests
  // ==========================================================================

  describe('Request Tracking', () => {
    it('should track successful requests', () => {
      expect(() => {
        monitoringService.trackRequest('GET /api/test', 150, true, {
          statusCode: 200,
        });
      }).not.toThrow();
    });

    it('should track failed requests', () => {
      expect(() => {
        monitoringService.trackRequest('POST /api/error', 300, false, {
          statusCode: 500,
        });
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Dependency Tracking Tests
  // ==========================================================================

  describe('Dependency Tracking', () => {
    it('should track HTTP dependencies', () => {
      expect(() => {
        monitoringService.trackDependency(
          'HTTP',
          'GET https://api.example.com',
          '/users',
          250,
          true
        );
      }).not.toThrow();
    });

    it('should track database dependencies', () => {
      expect(() => {
        monitoringService.trackDependency('SQL', 'SELECT users', 'SELECT * FROM users', 50, true);
      }).not.toThrow();
    });

    it('should track failed dependencies', () => {
      expect(() => {
        monitoringService.trackDependency('Redis', 'GET cache', 'GET user:123', 100, false);
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // User Context Tests
  // ==========================================================================

  describe('User Context', () => {
    it('should set user context', () => {
      expect(() => {
        monitoringService.setUser('user-123', {
          email: 'test@example.com',
          role: 'admin',
        });
      }).not.toThrow();
    });

    it('should set user context without properties', () => {
      expect(() => {
        monitoringService.setUser('user-456');
      }).not.toThrow();
    });

    it('should clear user context', () => {
      monitoringService.setUser('user-789');

      expect(() => {
        monitoringService.clearUser();
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Middleware Tests
  // ==========================================================================

  describe('Express Middleware', () => {
    it('should return error handler middleware', () => {
      const middleware = monitoringService.getErrorHandler();

      expect(middleware).toBeInstanceOf(Function);
      expect(middleware.length).toBe(4); // Express error middleware has 4 params
    });

    it('should return request handler middleware', () => {
      const middleware = monitoringService.getRequestHandler();

      expect(middleware).toBeInstanceOf(Function);
    });

    it('should return tracing handler middleware', () => {
      const middleware = monitoringService.getTracingHandler();

      expect(middleware).toBeInstanceOf(Function);
    });

    it('should return Sentry error handler middleware', () => {
      const middleware = monitoringService.getSentryErrorHandler();

      expect(middleware).toBeInstanceOf(Function);
    });

    it('should handle errors in error middleware', () => {
      const middleware = monitoringService.getErrorHandler();
      const error = new Error('Test error');
      const req = {
        url: '/test',
        method: 'GET',
        headers: {},
        query: {},
        body: {},
      };
      const res = {};
      const next = jest.fn();

      middleware(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ==========================================================================
  // Health Check Tests
  // ==========================================================================

  describe('Health Check', () => {
    it('should return health status', () => {
      const health = monitoringService.getHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('config');
    });

    it('should indicate initialization status', () => {
      const health = monitoringService.getHealth();

      expect(health.status).toBeDefined();
      expect(['OK', 'NOT_INITIALIZED']).toContain(health.status);
    });

    it('should include service statuses', () => {
      const health = monitoringService.getHealth();

      expect(health.services).toHaveProperty('applicationInsights');
      expect(health.services).toHaveProperty('sentry');

      expect(health.services.applicationInsights).toHaveProperty('enabled');
      expect(health.services.applicationInsights).toHaveProperty('initialized');

      expect(health.services.sentry).toHaveProperty('enabled');
      expect(health.services.sentry).toHaveProperty('initialized');
    });

    it('should include config', () => {
      const health = monitoringService.getHealth();

      expect(health.config).toHaveProperty('environment');
      expect(health.config).toHaveProperty('version');
    });

    it('should use convenience function getHealth', () => {
      const health = getHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('services');
    });
  });

  // ==========================================================================
  // Severity Mapping Tests
  // ==========================================================================

  describe('Severity Mapping', () => {
    it('should map severity levels correctly', () => {
      // Test internal mapping
      expect(monitoringService._mapSeverity('verbose')).toBe(0);
      expect(monitoringService._mapSeverity('info')).toBe(1);
      expect(monitoringService._mapSeverity('warning')).toBe(2);
      expect(monitoringService._mapSeverity('error')).toBe(3);
      expect(monitoringService._mapSeverity('critical')).toBe(4);
    });

    it('should map Sentry levels correctly', () => {
      expect(monitoringService._mapSentryLevel('verbose')).toBe('debug');
      expect(monitoringService._mapSentryLevel('info')).toBe('info');
      expect(monitoringService._mapSentryLevel('warning')).toBe('warning');
      expect(monitoringService._mapSentryLevel('error')).toBe('error');
      expect(monitoringService._mapSentryLevel('critical')).toBe('fatal');
    });

    it('should handle unknown severity levels', () => {
      expect(monitoringService._mapSeverity('unknown')).toBe(1); // Default to info
      expect(monitoringService._mapSentryLevel('unknown')).toBe('info');
    });
  });

  // ==========================================================================
  // Flush Tests
  // ==========================================================================

  describe('Flush', () => {
    it('should flush without errors', async () => {
      await expect(monitoringService.flush()).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle null error', () => {
      expect(() => {
        monitoringService.trackError(null, {});
      }).not.toThrow();
    });

    it('should handle undefined context', () => {
      const error = new Error('Test');

      expect(() => {
        monitoringService.trackError(error, undefined);
      }).not.toThrow();
    });

    it('should handle empty message', () => {
      expect(() => {
        monitoringService.trackMessage('', 'info');
      }).not.toThrow();
    });

    it('should handle negative metric values', () => {
      expect(() => {
        monitoringService.trackMetric('negative.metric', -100);
      }).not.toThrow();
    });

    it('should handle very long request names', () => {
      const longName = 'GET /' + 'a'.repeat(1000);

      expect(() => {
        monitoringService.trackRequest(longName, 100, true);
      }).not.toThrow();
    });
  });
});
