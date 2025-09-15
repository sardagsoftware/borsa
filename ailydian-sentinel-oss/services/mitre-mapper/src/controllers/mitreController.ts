import { Router, Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { MappingService } from '@/services/MappingService'
import { SecurityEvent, MappingRequest, ApiResponse } from '@/types'
import { logger } from '@/index'

const router = Router()
const mappingService = new MappingService()

// Validation schemas
const securityEventSchema = Joi.object({
  id: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  source: Joi.string().valid('suricata', 'zeek', 'falco', 'wazuh', 'yara', 'sigma', 'custom').required(),
  rule_id: Joi.string().optional(),
  rule_name: Joi.string().optional(),
  severity: Joi.string().valid('critical', 'high', 'medium', 'low', 'info').required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  src_ip: Joi.string().ip().optional(),
  dst_ip: Joi.string().ip().optional(),
  src_port: Joi.number().port().optional(),
  dst_port: Joi.number().port().optional(),
  protocol: Joi.string().optional(),
  user: Joi.string().optional(),
  hostname: Joi.string().optional(),
  process_name: Joi.string().optional(),
  command_line: Joi.string().optional(),
  file_path: Joi.string().optional(),
  file_hash: Joi.string().optional(),
  registry_key: Joi.string().optional(),
  raw_log: Joi.string().optional(),
  metadata: Joi.object().optional()
})

const mappingRequestSchema = Joi.object({
  events: Joi.array().items(securityEventSchema).min(1).max(1000).required(),
  include_metadata: Joi.boolean().default(true),
  min_confidence: Joi.number().min(0).max(1).default(0.5)
})

// Validation middleware
const validateMappingRequest = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = mappingRequestSchema.validate(req.body)
  if (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation Error',
      message: error.details[0].message
    }
    return res.status(400).json(response)
  }
  req.body = value
  next()
}

// Routes
/**
 * @route POST /api/v1/mitre/map
 * @desc Map security events to MITRE ATT&CK framework
 */
router.post('/map', validateMappingRequest, async (req: Request, res: Response) => {
  try {
    const startTime = Date.now()
    const { events, include_metadata, min_confidence }: MappingRequest = req.body

    logger.info(`🎯 Processing ${events.length} events for MITRE mapping`)

    // Map events to MITRE ATT&CK
    const mappedEvents = await mappingService.mapEvents(events, min_confidence)

    // Generate statistics
    const stats = mappingService.generateStats(mappedEvents)

    const processingTime = Date.now() - startTime
    const unmappedCount = mappedEvents.filter(e => !e.mitre).length

    const response: ApiResponse = {
      success: true,
      data: {
        mapped_events: include_metadata ? mappedEvents : mappedEvents.map(e => ({
          id: e.id,
          mitre: e.mitre
        })),
        stats,
        unmapped_count: unmappedCount,
        processing_time_ms: processingTime
      }
    }

    logger.info(`✅ Mapped ${mappedEvents.length - unmappedCount}/${mappedEvents.length} events in ${processingTime}ms`)

    res.json(response)
  } catch (error) {
    logger.error('Error in /map endpoint:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process mapping request'
    }
    res.status(500).json(response)
  }
})

/**
 * @route GET /api/v1/mitre/tactics
 * @desc Get available MITRE ATT&CK tactics
 */
router.get('/tactics', (req: Request, res: Response) => {
  try {
    const tactics = mappingService.getTactics()

    const response: ApiResponse = {
      success: true,
      data: {
        tactics,
        count: tactics.length
      }
    }

    res.json(response)
  } catch (error) {
    logger.error('Error in /tactics endpoint:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve tactics'
    }
    res.status(500).json(response)
  }
})

/**
 * @route GET /api/v1/mitre/coverage
 * @desc Get mapping coverage for all sources or specific source
 */
router.get('/coverage', (req: Request, res: Response) => {
  try {
    const source = req.query.source as string

    if (source) {
      const coverage = mappingService.getSourceCoverage(source)
      const response: ApiResponse = {
        success: true,
        data: coverage
      }
      return res.json(response)
    }

    // Get coverage for all sources
    const sources = ['suricata', 'zeek', 'falco', 'wazuh', 'yara', 'sigma']
    const coverageData = sources.map(s => mappingService.getSourceCoverage(s))

    const response: ApiResponse = {
      success: true,
      data: {
        sources: coverageData,
        summary: {
          total_sources: coverageData.length,
          total_rules: coverageData.reduce((sum, s) => sum + s.rules_count, 0),
          avg_confidence: coverageData.reduce((sum, s) => sum + s.avg_confidence, 0) / coverageData.length
        }
      }
    }

    res.json(response)
  } catch (error) {
    logger.error('Error in /coverage endpoint:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve coverage data'
    }
    res.status(500).json(response)
  }
})

/**
 * @route GET /api/v1/mitre/stats
 * @desc Get service statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = mappingService.getServiceStats()

    const response: ApiResponse = {
      success: true,
      data: stats
    }

    res.json(response)
  } catch (error) {
    logger.error('Error in /stats endpoint:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve service statistics'
    }
    res.status(500).json(response)
  }
})

/**
 * @route POST /api/v1/mitre/cache/clear
 * @desc Clear mapping cache
 */
router.post('/cache/clear', (req: Request, res: Response) => {
  try {
    mappingService.clearCache()

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      }
    }

    res.json(response)
  } catch (error) {
    logger.error('Error in /cache/clear endpoint:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to clear cache'
    }
    res.status(500).json(response)
  }
})

/**
 * @route POST /api/v1/mitre/map/single
 * @desc Map a single security event (for real-time processing)
 */
router.post('/map/single', async (req: Request, res: Response) => {
  try {
    const { error, value } = securityEventSchema.validate(req.body)
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Validation Error',
        message: error.details[0].message
      }
      return res.status(400).json(response)
    }

    const event: SecurityEvent = value
    const minConfidence = Number(req.query.min_confidence) || 0.5

    const mappedEvent = await mappingService.mapEvent(event, minConfidence)

    const response: ApiResponse = {
      success: true,
      data: {
        event: mappedEvent,
        has_mapping: !!mappedEvent.mitre,
        confidence: mappedEvent.mitre?.confidence || 0
      }
    }

    res.json(response)
  } catch (error) {
    logger.error('Error in /map/single endpoint:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process single event mapping'
    }
    res.status(500).json(response)
  }
})

export { router as mitreMapperController }