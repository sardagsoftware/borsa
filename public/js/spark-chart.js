// 📈 SPARK CHART COMPONENT - Canvas-based Lightweight Charts
// Renders time-series latency trends without heavy libraries

/**
 * Create a spark chart canvas element
 * @param {Array} data - Array of numeric values
 * @param {Object} options - Chart configuration
 * @returns {HTMLCanvasElement}
 */
function createSparkChart(data = [], options = {}) {
  const config = {
    width: options.width || 120,
    height: options.height || 40,
    lineColor: options.lineColor || '#00c47f',
    fillColor: options.fillColor || 'rgba(0, 196, 127, 0.15)',
    strokeWidth: options.strokeWidth || 2,
    showPoints: options.showPoints || false,
    pointRadius: options.pointRadius || 2,
    pointColor: options.pointColor || '#00c47f',
    showBaseline: options.showBaseline || false,
    baselineColor: options.baselineColor || 'rgba(255, 255, 255, 0.1)',
    animate: options.animate !== undefined ? options.animate : true,
    animationDuration: options.animationDuration || 600
  };

  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  canvas.style.display = 'block';

  // Store config for updates
  canvas._sparkConfig = config;
  canvas._sparkData = data;

  renderSparkChart(canvas, data, config);

  return canvas;
}

/**
 * Render spark chart to canvas
 * @param {HTMLCanvasElement} canvas
 * @param {Array} data
 * @param {Object} config
 */
function renderSparkChart(canvas, data, config) {
  const ctx = canvas.getContext('2d');
  const { width, height } = config;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // No data case
  if (!data || data.length === 0) {
    drawNoDataMessage(ctx, width, height);
    return;
  }

  // Calculate min/max for scaling
  const validData = data.filter(v => typeof v === 'number' && !isNaN(v));
  if (validData.length === 0) {
    drawNoDataMessage(ctx, width, height);
    return;
  }

  const minValue = Math.min(...validData);
  const maxValue = Math.max(...validData);
  const range = maxValue - minValue || 1; // Avoid division by zero

  // Calculate points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * width;
    const normalizedValue = (value - minValue) / range;
    const y = height - (normalizedValue * (height - 10)) - 5; // 5px padding top/bottom

    return { x, y, value };
  });

  // Draw baseline (optional)
  if (config.showBaseline) {
    ctx.strokeStyle = config.baselineColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, height - 5);
    ctx.lineTo(width, height - 5);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw fill area
  if (config.fillColor) {
    ctx.fillStyle = config.fillColor;
    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    points.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.closePath();
    ctx.fill();
  }

  // Draw line
  ctx.strokeStyle = config.lineColor;
  ctx.lineWidth = config.strokeWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();

  // Draw points (optional)
  if (config.showPoints) {
    ctx.fillStyle = config.pointColor;
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, config.pointRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

/**
 * Draw "No Data" message on canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
function drawNoDataMessage(ctx, width, height) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('No Data', width / 2, height / 2);
}

/**
 * Update existing spark chart with new data
 * @param {HTMLCanvasElement} canvas
 * @param {Array} data
 */
function updateSparkChart(canvas, data) {
  if (!canvas || !canvas._sparkConfig) {
    console.error('Invalid canvas or missing spark config');
    return;
  }

  canvas._sparkData = data;
  renderSparkChart(canvas, data, canvas._sparkConfig);
}

/**
 * Create a status-colored spark chart (auto color based on health)
 * @param {Array} data - Array of numeric values
 * @param {string} status - 'up' | 'warn' | 'down'
 * @param {Object} options - Additional options
 * @returns {HTMLCanvasElement}
 */
function createStatusSparkChart(data = [], status = 'up', options = {}) {
  const colorMap = {
    up: {
      lineColor: '#00c47f',
      fillColor: 'rgba(0, 196, 127, 0.15)',
      pointColor: '#00c47f'
    },
    warn: {
      lineColor: '#f9b233',
      fillColor: 'rgba(249, 178, 51, 0.15)',
      pointColor: '#f9b233'
    },
    down: {
      lineColor: '#e63946',
      fillColor: 'rgba(230, 57, 70, 0.15)',
      pointColor: '#e63946'
    }
  };

  const colors = colorMap[status] || colorMap.down;
  const config = {
    ...options,
    ...colors
  };

  return createSparkChart(data, config);
}

/**
 * Create a compact spark chart for inline display
 * @param {Array} data
 * @param {string} status
 * @returns {HTMLCanvasElement}
 */
function createCompactSparkChart(data = [], status = 'up') {
  return createStatusSparkChart(data, status, {
    width: 80,
    height: 24,
    strokeWidth: 1.5,
    showBaseline: false,
    showPoints: false
  });
}

/**
 * Create a large spark chart for dashboard display
 * @param {Array} data
 * @param {string} status
 * @returns {HTMLCanvasElement}
 */
function createDashboardSparkChart(data = [], status = 'up') {
  return createStatusSparkChart(data, status, {
    width: 240,
    height: 80,
    strokeWidth: 2,
    showBaseline: true,
    showPoints: false,
    baselineColor: 'rgba(255, 255, 255, 0.05)'
  });
}

/**
 * Generate sample data for testing
 * @param {number} count - Number of data points
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array}
 */
function generateSampleData(count = 60, min = 50, max = 500) {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min
  );
}

/**
 * Create a multi-series spark chart
 * @param {Array} series - Array of {data, color} objects
 * @param {Object} options
 * @returns {HTMLCanvasElement}
 */
function createMultiSeriesSparkChart(series = [], options = {}) {
  const config = {
    width: options.width || 240,
    height: options.height || 80,
    strokeWidth: options.strokeWidth || 2,
    showBaseline: options.showBaseline || false,
    baselineColor: options.baselineColor || 'rgba(255, 255, 255, 0.1)'
  };

  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  const { width, height } = config;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // No data case
  if (!series || series.length === 0) {
    drawNoDataMessage(ctx, width, height);
    return canvas;
  }

  // Find global min/max across all series
  let globalMin = Infinity;
  let globalMax = -Infinity;

  series.forEach(({ data }) => {
    const validData = data.filter(v => typeof v === 'number' && !isNaN(v));
    if (validData.length > 0) {
      globalMin = Math.min(globalMin, ...validData);
      globalMax = Math.max(globalMax, ...validData);
    }
  });

  const range = globalMax - globalMin || 1;

  // Draw each series
  series.forEach(({ data, color, fillColor }) => {
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const normalizedValue = (value - globalMin) / range;
      const y = height - (normalizedValue * (height - 10)) - 5;
      return { x, y, value };
    });

    // Draw fill (optional)
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(points[0].x, height);
      points.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.lineTo(points[points.length - 1].x, height);
      ctx.closePath();
      ctx.fill();
    }

    // Draw line
    ctx.strokeStyle = color || '#00c47f';
    ctx.lineWidth = config.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  });

  return canvas;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createSparkChart,
    updateSparkChart,
    createStatusSparkChart,
    createCompactSparkChart,
    createDashboardSparkChart,
    createMultiSeriesSparkChart,
    generateSampleData
  };
}
