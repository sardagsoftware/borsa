import { Router, Request, Response } from 'express'
import Joi from 'joi'
import { AlertHubService } from '@/services/AlertHubService'
import { EnrichmentService } from '@/services/EnrichmentService'
import { CorrelationEngine } from '@/services/CorrelationEngine'
import { SecurityAlert, AlertFilter, AlertResponse } from '@/types'
import { logger } from '@/index'
import { rateLimiter, sizeLimiter, validateContentType } from '@/middleware'

const router = Router()

// Services (these would be injected in a real application)
const alertHubService = new AlertHubService()
const enrichmentService = new EnrichmentService()
const correlationEngine = new CorrelationEngine()

// Validation schemas
const alertSchema = Joi.object({
  timestamp: Joi.string().isoDate().optional(),
  source: Joi.string().valid(
    'suricata', 'zeek', 'falco', 'wazuh', 'yara', 'sigma', 
    'osquery', 'sysmon', 'winlogbeat', 'filebeat', 'custom'
  ).required(),
  severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info').required(),
  category: Joi.string().valid(
    'malware', 'intrusion', 'data_exfiltration', 'privilege_escalation',
    'lateral_movement', 'persistence', 'command_control', 'reconnaissance',
    'initial_access', 'defense_evasion', 'credential_access', 'discovery',
    'collection', 'impact', 'anomaly', 'compliance', 'policy_violation'
  ).optional(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  src_ip: Joi.string().ip().optional(),
  dst_ip: Joi.string().ip().optional(),
  src_port: Joi.number().port().optional(),
  dst_port: Joi.number().port().optional(),
  protocol: Joi.string().optional(),
  hostname: Joi.string().optional(),
  user: Joi.string().optional(),
  process_name: Joi.string().optional(),
  command_line: Joi.string().optional(),
  file_path: Joi.string().optional(),
  file_hash: Joi.string().optional(),
  file_name: Joi.string().optional(),
  registry_key: Joi.string().optional(),
  registry_value: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional(),
  raw_event: Joi.any().optional()
})

const bulkAlertsSchema = Joi.object({
  alerts: Joi.array().items(alertSchema).min(1).max(1000).required(),
  enrich: Joi.boolean().default(true),
  correlate: Joi.boolean().default(true)
})

const alertFilterSchema = Joi.object({
  sources: Joi.array().items(Joi.string()).optional(),
  severities: Joi.array().items(Joi.string().valid('critical', 'high', 'medium', 'low', 'info')).optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  statuses: Joi.array().items(Joi.string().valid('open', 'investigating', 'escalated', 'resolved', 'false_positive', 'duplicate', 'suppressed')).optional(),
  from_date: Joi.string().isoDate().optional(),
  to_date: Joi.string().isoDate().optional(),
  search: Joi.string().optional(),
  limit: Joi.number().min(1).max(1000).default(50),
  offset: Joi.number().min(0).default(0),
  sort_by: Joi.string().valid('timestamp', 'severity', 'risk_score', 'created_at').default('timestamp'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
})

const alertUpdateSchema = Joi.object({
  status: Joi.string().valid('open', 'investigating', 'escalated', 'resolved', 'false_positive', 'duplicate', 'suppressed').optional(),
  assigned_to: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  false_positive_probability: Joi.number().min(0).max(1).optional(),
  metadata: Joi.object().optional()
})

// Apply middleware
router.use(rateLimiter(60000, 1000)) // 1000 requests per minute
router.use(sizeLimiter(50 * 1024 * 1024)) // 50MB max request size
router.use(validateContentType(['application/json']))

/**
 * @route POST /api/v1/alerts
 * @desc Submit a single security alert
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = alertSchema.validate(req.body)
    if (error) {
      const response: AlertResponse = {
        success: false,
        error: 'Validation Error',
        message: error.details[0].message
      }
      return res.status(400).json(response)
    }

    // Process the alert
    let alert = await alertHubService.processAlert(value)

    // Enrich the alert
    alert = await enrichmentService.enrichAlert(alert)

    const response: AlertResponse = {
      success: true,
      data: {
        alert_id: alert.id,
        status: 'processed',
        risk_score: alert.risk_score,
        enriched: !!alert.metadata?.enrichment
      }
    }

    res.status(201).json(response)
  } catch (error) {
    logger.error('Error in POST /alerts:', error)
    const response: AlertResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process alert'
    }
    res.status(500).json(response)
  }
})

/**
 * @route POST /api/v1/alerts/bulk
 * @desc Submit multiple security alerts in bulk
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { error, value } = bulkAlertsSchema.validate(req.body)
    if (error) {
      const response: AlertResponse = {
        success: false,
        error: 'Validation Error',
        message: error.details[0].message
      }
      return res.status(400).json(response)
    }

    const { alerts: rawAlerts, enrich, correlate } = value
    const processedAlerts: SecurityAlert[] = []
    const errors: Array<{ index: number; error: string }> = []

    // Process alerts in parallel
    const results = await Promise.allSettled(
      rawAlerts.map(async (rawAlert: any, index: number) => {
        try {
          let alert = await alertHubService.processAlert(rawAlert)
          
          if (enrich) {
            alert = await enrichmentService.enrichAlert(alert)
          }
          
          return { index, alert }
        } catch (error: any) {
          throw { index, error: error.message }
        }
      })
    )

    // Collect results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        processedAlerts.push(result.value.alert)
      } else {
        errors.push({ index, error: result.reason.error || 'Unknown error' })
      }
    })

    // Run correlation analysis if requested
    if (correlate && processedAlerts.length > 1) {
      // Trigger correlation analysis asynchronously
      correlationEngine.runAnalysis().catch(error => {
        logger.error('Error in correlation analysis:', error)
      })
    }

    const response: AlertResponse = {
      success: true,
      data: {
        processed: processedAlerts.length,
        errors: errors.length,
        alert_ids: processedAlerts.map(a => a.id),
        ...(errors.length > 0 && { processing_errors: errors })
      }
    }

    res.status(201).json(response)
  } catch (error) {
    logger.error('Error in POST /alerts/bulk:', error)
    const response: AlertResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process bulk alerts'
    }
    res.status(500).json(response)
  }
})

/**
 * @route GET /api/v1/alerts
 * @desc Search and filter alerts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = alertFilterSchema.validate(req.query)
    if (error) {
      const response: AlertResponse = {
        success: false,
        error: 'Validation Error',
        message: error.details[0].message
      }
      return res.status(400).json(response)
    }

    const filter: AlertFilter = value
    const result = await alertHubService.searchAlerts(filter)

    const response: AlertResponse = {
      success: true,
      data: {
        alerts: result.alerts,
        total: result.total,
        limit: filter.limit,
        offset: filter.offset,
        has_more: result.total > (filter.offset! + filter.limit!)
      }
    }

    res.json(response)
  } catch (error) {
    logger.error('Error in GET /alerts:', error)
    const response: AlertResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to search alerts'
    }
    res.status(500).json(response)
  }
})

/**
 * @route GET /api/v1/alerts/:id
 * @desc Get a specific alert by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const alertId = req.params.id
    const alert = await alertHubService.getAlert(alertId)

    if (!alert) {
      const response: AlertResponse = {
        success: false,
        error: 'Not Found',
        message: `Alert ${alertId} not found`
      }
      return res.status(404).json(response)
    }

    const response: AlertResponse = {
      success: true,
      data: { alert }
    }

    res.json(response)
  } catch (error) {
    logger.error(`Error in GET /alerts/${req.params.id}:`, error)
    const response: AlertResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve alert'
    }
    res.status(500).json(response)
  }
})

/**
 * @route PUT /api/v1/alerts/:id
 * @desc Update an existing alert
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { error, value } = alertUpdateSchema.validate(req.body)
    if (error) {
      const response: AlertResponse = {
        success: false,
        error: 'Validation Error',
        message: error.details[0].message
      }
      return res.status(400).json(response)
    }

    const alertId = req.params.id
    const updates = value

    const updatedAlert = await alertHubService.updateAlert(alertId, updates)

    const response: AlertResponse = {
      success: true,
      data: {
        alert: updatedAlert,
        updated_fields: Object.keys(updates)
      }
    }

    res.json(response)
  } catch (error: any) {
    logger.error(`Error in PUT /alerts/${req.params.id}:`, error)
    
    if (error.message?.includes('not found')) {
      const response: AlertResponse = {
        success: false,
        error: 'Not Found',
        message: error.message
      }
      return res.status(404).json(response)
    }

    const response: AlertResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update alert'
    }
    res.status(500).json(response)
  }
})

/**
 * @route GET /api/v1/alerts/stats
 * @desc Get alert statistics
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await alertHubService.getStats()

    const response: AlertResponse = {
      success: true,
      data: {
        stats,
        generated_at: new Date().toISOString()
      }
    }

    res.json(response)
  } catch (error) {
    logger.error('Error in GET /alerts/stats/overview:', error)
    const response: AlertResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve alert statistics'
    }
    res.status(500).json(response)
  }
})

/**
 * @route GET /api/v1/alerts/correlations
 * @desc Get correlation statistics
 */
router.get('/stats/correlations', async (req: Request, res: Response) => {
  try {
    const stats = await correlationEngine.getCorrelationStats()

    const response: AlertResponse = {
      success: true,
      data: {
        correlation_stats: stats,
        generated_at: new Date().toISOString()
      }
    }

    res.json(response)
  } catch (error) {
    logger.error('Error in GET /alerts/stats/correlations:', error)
    const response: AlertResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve correlation statistics'
    }
    res.status(500).json(response)
  }
})

/**
 * @route POST /api/v1/alerts/correlate
 * @desc Trigger manual correlation analysis
 */
router.post('/correlate', async (req: Request, res: Response) => {
  try {
    // Trigger correlation analysis
    correlationEngine.runAnalysis().catch(error => {
      logger.error('Error in manual correlation analysis:', error)
    })

    const response: AlertResponse = {
      success: true,
      data: {
        message: 'Correlation analysis triggered',
        timestamp: new Date().toISOString()
      }
    }

    res.json(response)
  } catch (error) {
    logger.error('Error in POST /alerts/correlate:', error)
    const response: AlertResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to trigger correlation analysis'
    }
    res.status(500).json(response)
  }
})

export { router as alertRoutes }