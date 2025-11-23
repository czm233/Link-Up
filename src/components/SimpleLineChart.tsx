import React from 'react';
import './SimpleLineChart.css';

interface Point {
    x: number;
    y: number;
}

interface SimpleLineChartProps {
    data: Point[];
    title: string;
    color: string;
    width?: number;
    height?: number;
    xLabel?: string;
    yLabel?: string;
    formatY?: (val: number) => string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
    data,
    title,
    color,
    width = 300,
    height = 150,
    xLabel,
    yLabel,
    formatY = (v) => v.toFixed(1)
}) => {
    if (!data || data.length < 2) {
        return (
            <div className="chart-container empty" style={{ width, height }}>
                <div className="chart-title">{title}</div>
                <div className="no-data">Not enough data</div>
            </div>
        );
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min/max
    const xValues = data.map(p => p.x);
    const yValues = data.map(p => p.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = 0; // Always start Y at 0 for better context usually
    const maxY = Math.max(...yValues) * 1.1; // Add 10% headroom

    // Scale functions
    const getX = (val: number) => {
        if (maxX === minX) return 0;
        return ((val - minX) / (maxX - minX)) * chartWidth;
    };

    const getY = (val: number) => {
        if (maxY === minY) return chartHeight;
        return chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;
    };

    // Generate path
    const points = data
        .map(p => `${getX(p.x) + padding.left},${getY(p.y) + padding.top}`)
        .join(' ');

    // Generate points for dots
    const dotElements = data.map((p, i) => (
        <circle
            key={i}
            cx={getX(p.x) + padding.left}
            cy={getY(p.y) + padding.top}
            r="3"
            fill={color}
            className="chart-dot"
        >
            <title>{`X: ${p.x}, Y: ${formatY(p.y)}`}</title>
        </circle>
    ));

    return (
        <div className="chart-container" style={{ width: '100%' }}>
            <div className="chart-title">{title}</div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="chart-svg">
                {/* Axes */}
                <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={height - padding.bottom}
                    stroke="#666"
                    strokeWidth="1"
                />
                <line
                    x1={padding.left}
                    y1={height - padding.bottom}
                    x2={width - padding.right}
                    y2={height - padding.bottom}
                    stroke="#666"
                    strokeWidth="1"
                />

                {/* Grid lines (Horizontal) */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const yVal = maxY * ratio;
                    const yPos = getY(yVal) + padding.top;
                    return (
                        <g key={ratio}>
                            <line
                                x1={padding.left}
                                y1={yPos}
                                x2={width - padding.right}
                                y2={yPos}
                                stroke="#333"
                                strokeDasharray="2,2"
                                strokeWidth="0.5"
                            />
                            <text
                                x={padding.left - 5}
                                y={yPos + 3}
                                textAnchor="end"
                                fontSize="10"
                                fill="#888"
                            >
                                {formatY(yVal)}
                            </text>
                        </g>
                    );
                })}

                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Dots */}
                {dotElements}

                {/* Labels */}
                {xLabel && (
                    <text
                        x={width / 2}
                        y={height - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#888"
                    >
                        {xLabel}
                    </text>
                )}
                {yLabel && (
                    <text
                        x={10}
                        y={height / 2}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#888"
                        transform={`rotate(-90, 10, ${height / 2})`}
                    >
                        {yLabel}
                    </text>
                )}
            </svg>
        </div>
    );
};

