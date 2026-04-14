export type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

export interface DataPoint {
  [key: string]: string | number;
}

export interface ChartConfig {
  id: string;
  title: string;
  description: string;
  type: ChartType;
  data: DataPoint[];
  xAxisKey: string;
  seriesKeys: string[];
}

export interface Insight {
  id: string;
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AIProfile {
  domain: string;
  description: string;
}

export interface DatasetSnapshot {
  filename: string;
  row_count: number;
  memory_mb: number;
  columns: {
    name: string;
    dtype: string;
  }[];
  sample_rows: Record<string, any>[];
  profile: AIProfile;
  chart_config?: ChartConfig;
}

export interface DashboardResponse {
  snapshots: DatasetSnapshot[];
  charts: ChartConfig[];
}
