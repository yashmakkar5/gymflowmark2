// Minimalist Clean SVG Charts (No heavy chart.js or highcharts bloat)

export const Charts = {
  renderRevenueChart(container, data) {
    if (!container || !data || !data.length) return;

    const width = 600;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 20 };

    const revenues = data.map((d) => d.revenue);
    const maxVal = Math.max(...revenues, 10000) * 1.15;
    const minVal = 0;

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH - ((d.revenue - minVal) / (maxVal - minVal)) * chartH;
      return { x, y, ...d };
    });

    const pathD = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      // Smooth curve
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    const svgHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; overflow: visible;">
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10E57A" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#10E57A" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Subtle Grid Lines -->
        <line x1="${padding.left}" y1="${padding.top + chartH}" x2="${width - padding.right}" y2="${padding.top + chartH}" stroke="#27272A" stroke-width="1" />
        <line x1="${padding.left}" y1="${padding.top + chartH / 2}" x2="${width - padding.right}" y2="${padding.top + chartH / 2}" stroke="#1E1E22" stroke-dasharray="3,3" stroke-width="1" />

        <!-- Area Fill -->
        <path d="${areaD}" fill="url(#revenueGradient)" />

        <!-- Main Stroke Line -->
        <path d="${pathD}" fill="none" stroke="#10E57A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Data Dots & X Axis Labels -->
        ${points
          .map(
            (p) => `
          <g class="chart-point" data-revenue="₹${p.revenue.toLocaleString('en-IN')}" data-month="${p.month}">
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="#09090B" stroke="#10E57A" stroke-width="2" />
            <text x="${p.x}" y="${height - 8}" font-size="11" font-weight="500" fill="#71717A" text-anchor="middle" font-family="'Inter', sans-serif">
              ${p.month}
            </text>
          </g>
        `
          )
          .join('')}
      </svg>
    `;

    container.innerHTML = svgHTML;
  },

  renderAttendanceBars(container, data) {
    if (!container || !data || !data.length) return;

    const width = 320;
    const height = 140;
    const padding = { top: 15, right: 15, bottom: 25, left: 15 };

    const counts = data.map((d) => d.count);
    const maxVal = Math.max(...counts, 10) * 1.2;

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barWidth = Math.min(24, (chartW / data.length) * 0.55);

    const barsHTML = data
      .map((d, i) => {
        const x = padding.left + (i + 0.5) * (chartW / data.length) - barWidth / 2;
        const barH = (d.count / maxVal) * chartH;
        const y = padding.top + chartH - barH;
        const isLatest = i === data.length - 1;
        const color = isLatest ? '#10E57A' : '#27272A';

        return `
        <g class="bar-group">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="3" fill="${color}" />
          <text x="${x + barWidth / 2}" y="${y - 4}" font-size="10" font-weight="600" fill="#A1A1AA" text-anchor="middle" font-family="'Inter', sans-serif">
            ${d.count}
          </text>
          <text x="${x + barWidth / 2}" y="${height - 6}" font-size="11" font-weight="500" fill="#71717A" text-anchor="middle" font-family="'Inter', sans-serif">
            ${d.day}
          </text>
        </g>
      `;
      })
      .join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto;">
        ${barsHTML}
      </svg>
    `;
  },
};
