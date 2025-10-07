/**
 * 📊 Civic Intelligence Grid - Charts & Visualization Library
 * Chart.js, D3.js, Mapbox Integration with Real-Time Data
 * Version: 1.0.0 PRODUCTION
 * Date: 2025-10-07
 */

(function() {
    'use strict';

    /**
     * Civic Charts Manager - Singleton
     */
    class CivicChartsManager {
        constructor() {
            this.charts = {};
            this.dataCache = {};
            this.updateIntervals = {};
            this.apiBaseURL = '/api/civic';
        }

        /**
         * Fetch data from Civic API
         */
        async fetchData(endpoint) {
            try {
                const response = await fetch(`${this.apiBaseURL}${endpoint}`);
                const data = await response.json();

                if (data.success) {
                    this.dataCache[endpoint] = {
                        data: data.data || data,
                        timestamp: Date.now()
                    };
                    return data.data || data;
                }
                throw new Error(data.error || 'API error');
            } catch (error) {
                console.error(`Civic API Error (${endpoint}):`, error);
                return null;
            }
        }

        /**
         * Create Line Chart (Traffic, Health trends)
         */
        createLineChart(canvasId, config = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn(`Canvas #${canvasId} not found`);
                return null;
            }

            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: config.data || {
                    labels: [],
                    datasets: [{
                        label: config.label || 'Data',
                        data: [],
                        borderColor: config.color || '#10A37F',
                        backgroundColor: config.backgroundColor || 'rgba(16, 163, 127, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: config.showLegend !== false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    ...config.options
                }
            });

            this.charts[canvasId] = chart;
            return chart;
        }

        /**
         * Create Bar Chart (Risk categories, Health metrics)
         */
        createBarChart(canvasId, config = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'bar',
                data: config.data || {
                    labels: [],
                    datasets: [{
                        label: config.label || 'Data',
                        data: [],
                        backgroundColor: config.colors || ['#10A37F', '#3B82F6', '#F59E0B', '#EF4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: config.showLegend !== false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    ...config.options
                }
            });

            this.charts[canvasId] = chart;
            return chart;
        }

        /**
         * Create Doughnut Chart (Distribution, Status)
         */
        createDoughnutChart(canvasId, config = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: config.data || {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: config.colors || [
                            '#10A37F', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: config.legendPosition || 'bottom'
                        }
                    },
                    ...config.options
                }
            });

            this.charts[canvasId] = chart;
            return chart;
        }

        /**
         * Create Radar Chart (Multi-dimensional risk assessment)
         */
        createRadarChart(canvasId, config = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'radar',
                data: config.data || {
                    labels: [],
                    datasets: [{
                        label: config.label || 'Assessment',
                        data: [],
                        backgroundColor: 'rgba(16, 163, 127, 0.2)',
                        borderColor: '#10A37F',
                        pointBackgroundColor: '#10A37F'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100
                        }
                    },
                    ...config.options
                }
            });

            this.charts[canvasId] = chart;
            return chart;
        }

        /**
         * Update chart data
         */
        updateChart(chartId, newData) {
            const chart = this.charts[chartId];
            if (!chart) return;

            if (newData.labels) {
                chart.data.labels = newData.labels;
            }

            if (newData.datasets) {
                newData.datasets.forEach((dataset, index) => {
                    if (chart.data.datasets[index]) {
                        chart.data.datasets[index].data = dataset.data;
                    }
                });
            }

            chart.update();
        }

        /**
         * Create Network Graph with D3.js (Trust Graph)
         */
        createNetworkGraph(containerId, data) {
            const container = document.getElementById(containerId);
            if (!container) return null;

            const width = container.clientWidth;
            const height = container.clientHeight || 500;

            // Clear existing
            container.innerHTML = '';

            const svg = d3.select(`#${containerId}`)
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            const simulation = d3.forceSimulation(data.nodes)
                .force('link', d3.forceLink(data.edges).id(d => d.id).distance(100))
                .force('charge', d3.forceManyBody().strength(-300))
                .force('center', d3.forceCenter(width / 2, height / 2));

            const link = svg.append('g')
                .selectAll('line')
                .data(data.edges)
                .enter().append('line')
                .attr('stroke', '#999')
                .attr('stroke-width', d => Math.sqrt(d.weight / 10));

            const node = svg.append('g')
                .selectAll('circle')
                .data(data.nodes)
                .enter().append('circle')
                .attr('r', 20)
                .attr('fill', d => {
                    const trustPercent = d.trust / 100;
                    return `rgb(${255 - trustPercent * 255}, ${trustPercent * 255}, 100)`;
                })
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));

            const label = svg.append('g')
                .selectAll('text')
                .data(data.nodes)
                .enter().append('text')
                .text(d => d.label)
                .attr('font-size', 12)
                .attr('dx', 25)
                .attr('dy', 5);

            simulation.on('tick', () => {
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);

                node
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);

                label
                    .attr('x', d => d.x)
                    .attr('y', d => d.y);
            });

            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }

            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

            return {svg, simulation};
        }

        /**
         * Create Heatmap (Zone-based metrics)
         */
        createHeatmap(canvasId, data) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'matrix',
                data: {
                    datasets: [{
                        label: 'Zone Activity',
                        data: data,
                        backgroundColor(c) {
                            const value = c.raw.v;
                            const alpha = value / 100;
                            return `rgba(16, 163, 127, ${alpha})`;
                        },
                        width: ({chart}) => (chart.chartArea || {}).width / data.length - 1,
                        height: ({chart}) => (chart.chartArea || {}).height / data.length - 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: false,
                        tooltip: {
                            callbacks: {
                                title() {
                                    return '';
                                },
                                label(context) {
                                    const v = context.raw;
                                    return ['Zone: ' + v.x + ', ' + v.y, 'Value: ' + v.v];
                                }
                            }
                        }
                    }
                }
            });

            this.charts[canvasId] = chart;
            return chart;
        }

        /**
         * Start real-time updates
         */
        startRealTimeUpdates(chartId, endpoint, interval = 5000) {
            if (this.updateIntervals[chartId]) {
                clearInterval(this.updateIntervals[chartId]);
            }

            const updateFn = async () => {
                const data = await this.fetchData(endpoint);
                if (data && this.charts[chartId]) {
                    // Transform data based on chart type
                    this.updateChart(chartId, this.transformDataForChart(data));
                }
            };

            // Initial update
            updateFn();

            // Set interval
            this.updateIntervals[chartId] = setInterval(updateFn, interval);
        }

        /**
         * Transform API data for charts
         */
        transformDataForChart(data) {
            // Example transformation - customize per chart
            if (Array.isArray(data)) {
                return {
                    labels: data.map((d, i) => d.label || `Point ${i + 1}`),
                    datasets: [{
                        data: data.map(d => d.value || d)
                    }]
                };
            }
            return data;
        }

        /**
         * Stop real-time updates
         */
        stopRealTimeUpdates(chartId) {
            if (this.updateIntervals[chartId]) {
                clearInterval(this.updateIntervals[chartId]);
                delete this.updateIntervals[chartId];
            }
        }

        /**
         * Destroy chart
         */
        destroyChart(chartId) {
            if (this.charts[chartId]) {
                this.charts[chartId].destroy();
                delete this.charts[chartId];
            }
            this.stopRealTimeUpdates(chartId);
        }

        /**
         * Destroy all charts
         */
        destroyAll() {
            Object.keys(this.charts).forEach(chartId => {
                this.destroyChart(chartId);
            });
        }
    }

    /**
     * Loading State Manager
     */
    class LoadingStateManager {
        static showLoader(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const loader = document.createElement('div');
            loader.className = 'civic-loader';
            loader.innerHTML = `
                <div class="civic-loader-spinner"></div>
                <p>Yükleniyor...</p>
            `;
            container.appendChild(loader);
        }

        static hideLoader(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const loader = container.querySelector('.civic-loader');
            if (loader) {
                loader.remove();
            }
        }

        static showSkeleton(containerId, type = 'chart') {
            const container = document.getElementById(containerId);
            if (!container) return;

            const skeleton = document.createElement('div');
            skeleton.className = `civic-skeleton civic-skeleton-${type}`;
            skeleton.innerHTML = type === 'chart'
                ? '<div class="skeleton-bar"></div><div class="skeleton-bar"></div><div class="skeleton-bar"></div>'
                : '<div class="skeleton-line"></div><div class="skeleton-line"></div>';

            container.appendChild(skeleton);
        }

        static hideSkeleton(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const skeleton = container.querySelector('.civic-skeleton');
            if (skeleton) {
                skeleton.remove();
            }
        }
    }

    /**
     * Metric Card Manager
     */
    class MetricCardManager {
        static updateCard(cardId, data) {
            const card = document.getElementById(cardId);
            if (!card) return;

            const valueEl = card.querySelector('.metric-value');
            const trendEl = card.querySelector('.metric-trend');
            const labelEl = card.querySelector('.metric-label');

            if (valueEl && data.value !== undefined) {
                valueEl.textContent = data.value;
            }

            if (trendEl && data.trend) {
                trendEl.textContent = data.trend;
                trendEl.className = `metric-trend ${data.trendDirection || 'neutral'}`;
            }

            if (labelEl && data.label) {
                labelEl.textContent = data.label;
            }
        }

        static animateValue(element, start, end, duration = 1000) {
            const range = end - start;
            const increment = end > start ? 1 : -1;
            const stepTime = Math.abs(Math.floor(duration / range));
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                element.textContent = current;

                if (current === end) {
                    clearInterval(timer);
                }
            }, stepTime);
        }
    }

    // Initialize global instance
    window.CivicCharts = new CivicChartsManager();
    window.CivicLoading = LoadingStateManager;
    window.CivicMetrics = MetricCardManager;

    console.log('📊 Civic Charts Library initialized');

})();
