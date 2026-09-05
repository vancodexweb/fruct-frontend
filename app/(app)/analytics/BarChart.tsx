import styles from "./chart.module.css";

export interface BarDatum {
  /** Stable key for the React list — falls back to label if omitted. */
  key?: string;
  label: string;
  value: number;
  /** Shown as the native SVG tooltip on hover/focus; defaults to "label: value". */
  title?: string;
  /**
   * When set, always rendered above the bar (e.g. a short secondary count) instead
   * of the default formatted-value label, which is suppressed past MAX_LABELED_BARS
   * to avoid clutter — a caller-supplied secondary label is short by construction
   * and stays useful at any category count.
   */
  secondaryLabel?: string;
}

/** Categories beyond this count skip on-bar value labels (spec: selective labels, never one on every point) and fall back to the accompanying Table for exact figures. */
const MAX_LABELED_BARS = 12;
const MIN_PX_PER_BAR = 34;

function clampRadius(radius: number, width: number, height: number): number {
  return Math.max(0, Math.min(radius, width / 2, height / 2));
}

/** Rounded top corners, flush baseline — the bar's "data end" is the rounded one. */
function roundedTopRectPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = clampRadius(radius, width, height);
  if (height <= 0) return "";
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    "Z",
  ].join(" ");
}

/** Rounded right (leading) corners, flush against the axis — for horizontal bars. */
function roundedRightRectPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = clampRadius(radius, width, height);
  if (width <= 0) return "";
  return [
    `M ${x} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height - r}`,
    `Q ${x + width} ${y + height} ${x + width - r} ${y + height}`,
    `L ${x} ${y + height}`,
    "Z",
  ].join(" ");
}

interface VerticalBarChartProps {
  data: BarDatum[];
  ariaLabel: string;
  /** A CSS color value, typically one of the design system's semantic tokens (e.g. "var(--accent)"). */
  color?: string;
  formatValue?: (value: number) => string;
}

/** A single-series vertical bar chart. Categories run along x, magnitude along y. */
export function VerticalBarChart({ data, ariaLabel, color = "var(--accent)", formatValue }: VerticalBarChartProps) {
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 28;
  const barGap = 14;
  const chartHeight = 220;
  const bottomAxisHeight = 56;
  const topPadding = 12;
  const innerHeight = chartHeight - bottomAxisHeight - topPadding;
  const vbWidth = data.length * (barWidth + barGap) + barGap;
  const showValueLabels = data.length <= MAX_LABELED_BARS;
  const format = formatValue ?? ((value: number) => String(value));

  return (
    <div className={`scrollX ${styles.scrollWrap}`}>
      <svg
        viewBox={`0 0 ${vbWidth} ${chartHeight}`}
        role="img"
        aria-label={ariaLabel}
        style={{ width: "100%", minWidth: `${data.length * MIN_PX_PER_BAR}px`, height: "auto" }}
      >
        <line
          x1={0}
          y1={topPadding + innerHeight}
          x2={vbWidth}
          y2={topPadding + innerHeight}
          className={styles.axisLine}
        />
        {data.map((d, index) => {
          const barHeight = maxValue > 0 ? (d.value / maxValue) * innerHeight : 0;
          const x = barGap + index * (barWidth + barGap);
          const y = topPadding + (innerHeight - barHeight);
          const label = d.secondaryLabel ?? (showValueLabels ? format(d.value) : undefined);
          return (
            <g key={d.key ?? d.label}>
              <path d={roundedTopRectPath(x, y, barWidth, barHeight, 4)} fill={color} className={styles.bar}>
                <title>{d.title ?? `${d.label}: ${format(d.value)}`}</title>
              </path>
              {label !== undefined ? (
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className={styles.valueLabel}>
                  {label}
                </text>
              ) : null}
              <text
                x={x + barWidth / 2}
                y={topPadding + innerHeight + 14}
                textAnchor="end"
                className={styles.axisLabel}
                transform={`rotate(-40 ${x + barWidth / 2} ${topPadding + innerHeight + 14})`}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface HorizontalBarChartProps {
  data: BarDatum[];
  ariaLabel: string;
  color?: string;
  formatValue?: (value: number) => string;
}

/** A single-series horizontal bar chart — reads well for long category names (product/manager names) and long lists, since it grows taller rather than squeezing bar width. */
export function HorizontalBarChart({ data, ariaLabel, color = "var(--accent)", formatValue }: HorizontalBarChartProps) {
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const rowHeight = 30;
  const barHeight = 16;
  const labelWidth = 150;
  const rightPadding = 90;
  const vbWidth = 420;
  const vbHeight = data.length * rowHeight + 8;
  const barAreaWidth = vbWidth - labelWidth - rightPadding;
  const format = formatValue ?? ((value: number) => String(value));

  return (
    <svg viewBox={`0 0 ${vbWidth} ${vbHeight}`} role="img" aria-label={ariaLabel} style={{ width: "100%", height: "auto" }}>
      {data.map((d, index) => {
        const barWidth = maxValue > 0 ? (d.value / maxValue) * barAreaWidth : 0;
        const y = index * rowHeight + (rowHeight - barHeight) / 2 + 4;
        return (
          <g key={d.key ?? d.label}>
            <text x={labelWidth - 8} y={y + barHeight / 2 + 4} textAnchor="end" className={styles.axisLabel}>
              {d.label}
            </text>
            <path d={roundedRightRectPath(labelWidth, y, barWidth, barHeight, 4)} fill={color} className={styles.bar}>
              <title>{d.title ?? `${d.label}: ${format(d.value)}`}</title>
            </path>
            <text x={labelWidth + barWidth + 8} y={y + barHeight / 2 + 4} textAnchor="start" className={styles.valueLabel}>
              {format(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
