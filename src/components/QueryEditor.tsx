import React, { ChangeEvent, useEffect, useState } from 'react';
import { AsyncSelect, InlineField, Input, Select, Stack } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, AMSQuery } from '../types';
import AutocompleteInput from './AutoComplete';

type Props = QueryEditorProps<DataSource, AMSQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const { component, metric, hosts, aggregator, alias, transform, precision } = query;
  const [componentOptionsValue, setComponentOptionsValue] = useState<string[]>([]);
  const [metricOptionsValue, setMetricOptionsValue] = useState<{ [key: string]: any[] }>({});
  const [metricOptions, setMetricOptions] = useState<string[]>([]);
  const [hostOptionsValue, setHostOptionsValue] = useState<{ [key: string]: any[] }>({});
  const [hostOptions, setHostOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchHostOptions = async () => {
      const { compToHostMap } = await datasource.generateHostsOptions();
      setHostOptionsValue(compToHostMap);
      if (component !== '') {
        setHostOptions(compToHostMap[component]);
      }
    };
    fetchHostOptions();

    const fetchComponentOptions = async () => {
      const { components, allMetrics } = await datasource.generateOptions();
      let sortedComponents = components.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      setComponentOptionsValue(sortedComponents);
      setMetricOptionsValue(allMetrics);
      if (component !== '') {
        let sortedMetricOptions = allMetrics[component].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setMetricOptions(sortedMetricOptions);
      }
    };
    fetchComponentOptions();
  }, []);

  const onComponentChange = (inputValue: any) => {
    if (inputValue === '') {
      setMetricOptions([]);
      setHostOptions([]);
    } else {
      let sortedMetricOptions = metricOptionsValue[inputValue].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      setMetricOptions(sortedMetricOptions);
      let sortedHostOptions = hostOptionsValue[inputValue].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      setHostOptions(sortedHostOptions);
    }
    onChange({ ...query, component: inputValue });
    onRunQuery();
  };

  const onMetricChange = (inputValue: any) => {
    onChange({ ...query, metric: inputValue });
    onRunQuery();
  };

  const onHostsChange = (v: any) => {
    onChange({ ...query, hosts: v });
    onRunQuery();
  };

  const onAggregatorChange = (v: any) => {
    onChange({ ...query, aggregator: v });
  }

  const generateAggregatorOptions = () => {
    const options = [
      { label: 'none', value: 'none' },
      { label: 'avg', value: 'avg' },
      { label: 'sum', value: 'sum' },
      { label: 'min', value: 'min' },
      { label: 'max', value: 'max' },
    ];
    return options;
  };

  const onAliasChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, alias: event.target.value });
  }

  const onTransformChange = (v: any) => {
    onChange({ ...query, transform: v });
  }

  const generateTransformOptions = () => {
    const options = [
      { label: 'none', value: 'none' },
      { label: 'diff', value: 'diff' },
      { label: 'rate', value: 'rate' },
    ];
    return options;
  };

  const onPrecisionChange = (v: any) => {
    onChange({ ...query, precision: v });
  }

  const generatePrecisionOptions = () => {
    const options = [
      { label: 'default', value: 'default' },
      { label: 'seconds', value: 'seconds' },
      { label: 'minutes', value: 'minutes' },
      { label: 'hours', value: 'hours' },
      { label: 'days', value: 'days' },
    ];
    return options;
  };

  return (
    <>
      <Stack gap={0}>
        <InlineField label="Component">
          <AutocompleteInput
            placeholder="Search Component"
            suggestions={componentOptionsValue}
            onChange={onComponentChange}
            value={component}
          // onBlur={onComponentChange}
          />
        </InlineField>
        <InlineField label="Metric">
          <AutocompleteInput
            value={metric}
            placeholder="Search Metric"
            suggestions={metricOptions}
            onChange={onMetricChange}
          // onBlur={onMetricChange}
          />
        </InlineField>
        <InlineField label="Hosts">
          <AutocompleteInput
            value={hosts}
            placeholder="Search Hosts"
            suggestions={hostOptions}
            onChange={onHostsChange}
          // onBlur={onHostsChange}
          />
        </InlineField>
        <InlineField label="Aggregator">
          <Select
            id="query-editor-aggregator"
            onChange={onAggregatorChange}
            value={aggregator}
            options={generateAggregatorOptions()}
            width={25}
            placeholder="Choose Aggregator"
          />
        </InlineField>

      </Stack>
      <Stack>
        <InlineField label="Alias">
          <Input value={alias} placeholder="Series Alias" onChange={onAliasChange} />
        </InlineField>
        <InlineField label="Transform">
          <Select
            id="query-editor-aggregator"
            onChange={onTransformChange}
            value={transform}
            options={generateTransformOptions()}
            width={25}
            placeholder="Choose Transform"
          />
        </InlineField>
        <InlineField label="Precision">
          <Select
            id="query-editor-aggregator"
            onChange={onPrecisionChange}
            value={precision}
            options={generatePrecisionOptions()}
            width={25}
            placeholder="Choose Precision"
          />
        </InlineField>
      </Stack>
    </>
  );
}
