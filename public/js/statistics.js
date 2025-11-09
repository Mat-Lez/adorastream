import { apiRequest as api } from '/utils/api-utils.js';

let isChartJsLoaded = false;
let isChartJsLoading = false;

const chartInstances = {};

function loadChartJSScript() {
    return new Promise((resolve, reject) => {
        if (isChartJsLoaded) {
            resolve();
            return;
        }
        if (isChartJsLoading) {
            document.addEventListener('chartjs-loaded', () => resolve(), { once: true });
            document.addEventListener('chartjs-load-error', () => reject(), { once: true });
            return;
        }
        isChartJsLoading = true;
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
        script.onload = () => {
            isChartJsLoaded = true;
            isChartJsLoading = false;
            document.dispatchEvent(new Event('chartjs-loaded'));
            resolve();
        };
        script.onerror = () => {
            isChartJsLoading = false;
            document.dispatchEvent(new Event('chartjs-load-error'));
            reject(new Error("Failed to load Chart.js library from CDN."));
        };
        document.head.appendChild(script);
    });
}

function getThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
        primary: styles.getPropertyValue('--primary').trim() || '#238636',
        danger: styles.getPropertyValue('--danger').trim() || '#da3633',
        text: styles.getPropertyValue('--text').trim() || '#e6edf3',
        muted: styles.getPropertyValue('--muted').trim() || '#8b949e',
        panel: styles.getPropertyValue('--panel').trim() || '#161b22',
        bg: styles.getPropertyValue('--bg').trim() || '#0d1117',
        border: styles.getPropertyValue('--button-border').trim() || '#30363d',
        primary600: styles.getPropertyValue('--primary-600').trim() || '#2ea043',
        blue: '#58a6ff'
    };
}

/**
 * A generic function to create any chart.
 * Handles loading, fetching, error handling, and theming.
 * * @param {string} canvasId - The 'id' of the <canvas> element.
 * @param {string} apiEndpoint - The API URL to fetch data from.
 * @param {function} createChartConfig - A function that takes (data, theme) and returns { type, data, options }
 * @param {string} noDataMessage - Text to display if API returns no data.
 */
async function createChart(canvasId, apiEndpoint, createChartConfig, noDataMessage = "No data available.") {
    
    const chartWrapper = document.getElementById(canvasId)?.parentElement;
    const canvas = document.getElementById(canvasId);

    if (!canvas || !chartWrapper) {
        console.error(`Canvas or wrapper not found for chart: ${canvasId}`);
        return;
    }

    try {
        await loadChartJSScript();

        const data = await api(apiEndpoint);
        
        const theme = getThemeColors();

        if (!Array.isArray(data) || data.length === 0) {
            console.warn(`No data for ${canvasId}.`);
            chartWrapper.innerHTML = `<p class="subtitle" style="text-align: center;">${noDataMessage}</p>`;
            return;
        }

        const { type, data: chartData, options } = createChartConfig(data, theme);

        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }

        // Set global chart defaults
        window.Chart.defaults.color = theme.muted;
        window.Chart.defaults.borderColor = theme.border;

        // Creates a CanvasRenderingContext2D object representing a two-dimensional rendering context.
        const ctx = canvas.getContext('2d');
        
        chartInstances[canvasId] = new window.Chart(ctx, 
        {
            type: type,
            data: chartData,
            options: options
        });

    } catch (err) {
        console.error(`Error during chart creation for ${canvasId}:`, err);
        if (chartWrapper) {
            chartWrapper.innerHTML = `<p class="error">${err.message || 'Could not load chart.'}</p>`;
        }
    }
}

/**
 * Creates the specific config for the Genre Pie Chart.
 * This is the "unique" part you identified.
 * @param {Array} data - The data from the API
 * @param {object} theme - The computed theme colors
 * @returns {object} A Chart.js config object
 */
function createGenrePieConfig(data, theme, days) {
    const labels = data.map(item => item.genre);
    const values = data.map(item => item.watchedCount);

    const colors = [
        theme.primary, theme.blue, theme.danger,
        theme.text, theme.muted, theme.primary600
    ];
    const backgroundColors = labels.map((_, i) => colors[i % colors.length]);

    return {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderColor: theme.bg,
                borderWidth: 3,
                hoverBorderColor: theme.text
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Watched Content by Genre (Past ${days || 7} days)`,
                    font: { size: 18 },
                    color: theme.text
                },
                legend: {
                    position: 'right',
                    labels: { boxWidth: 20, color: theme.muted }
                },
                tooltip: {
                    backgroundColor: theme.panel,
                    titleColor: theme.text,
                    bodyColor: theme.muted,
                    borderColor: theme.border,
                    borderWidth: 1,
                    callbacks: {
                        label: ctx => `${ctx.label}: ${ctx.parsed} watched`
                    }
                }
            }
        }
    };
}

/**
 * Renders the Genre Pie Chart by calling the generic createChart function.
 * @param {number} days - The number of days to fetch data for.
 */
function pieForWatchedContentByGenreByProfileID(days = 7) {
    createChart(
        'genrePieChart',
        `/api/stats/watchedContentByGenreByProfileID?days=${days}`,
        (data, theme) => {
            return createGenrePieConfig(data, theme, days);
        },
        `No watch activity in the past ${days} days.`
    );
}

export function initStatisticsCharts() {
    pieForWatchedContentByGenreByProfileID(7);
}