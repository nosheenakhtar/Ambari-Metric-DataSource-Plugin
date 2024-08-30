import { DataSourceJsonData, DateTime } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface AMSQuery extends DataQuery {
  queryText?: string;
  constant: number;
  component: string;//{ label: any; value: string; };
  metric: string;//{ label: any; value: string; };
  hosts: string; //{ label: any; value: string; };
  aggregator: { label: any; value: string; };
  alias: string;
  transform: { label: any; value: string; };
  precision: { label: any; value: string; };
  templatedHost: any;
}

export const DEFAULT_QUERY: Partial<AMSQuery> = {
  constant: 6.5,
  queryText: "test",
  component: '',
  metric: '',
  hosts: '',
  aggregator: { label: 'avg', value: 'avg' },
  precision: { label: 'default', value: 'default' },
  transform: { label: 'none', value: 'none' },
};

export interface DataPoint {
  Time: number;
  Value: number;
}

export interface DataSourceResponse {
  datapoints: DataPoint[];
  metrics: MetricData[];
}

type MetricData = {
  metrics: Metric;
  hostname: string;
  starttime: DateTime;
  metricname: string;
  // other properties...
};

type Metric = {
  [timestamp: string]: number;
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  path?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}
