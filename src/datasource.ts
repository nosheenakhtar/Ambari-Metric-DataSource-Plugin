import { BackendSrvRequest, getBackendSrv, isFetchError, getTemplateSrv, DataSourceWithBackend } from '@grafana/runtime';
import {
  CoreApp,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  DataFrame,
  ScopedVars,
  MetricFindValue,
  QueryVariableModel
} from '@grafana/data';
import { AMSQuery, MyDataSourceOptions, DEFAULT_QUERY, DataSourceResponse } from './types';
import { lastValueFrom, Observable } from 'rxjs';
import _ from 'lodash';

export class DataSource extends DataSourceApi<AMSQuery, MyDataSourceOptions> {
  baseUrl: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    // let test = DataQueryRequest<AMSQuery>
    // debuggertest
    this.baseUrl = instanceSettings.url!;
  }
  getDefaultQuery(_: CoreApp): Partial<AMSQuery> {
    return DEFAULT_QUERY;
  }

  filterQuery(query: AMSQuery): boolean {
    // if no query has been provided, prevent the query from being executed
    if ((query.component === undefined || query.component === '') || (query.metric === undefined || query.metric === '')) {
      return false;
    } else {
      return true;
    }
  }

  async generateOptions() {
    let components: string[] = [];
    let allMetrics: { [key: string]: any[] } = {};
    const res = await this.request('/ws/v1/timeline/metrics/metadata')
    let data: any = res.data;
    for (let key in data) {
      components.push(key);
      data[key].forEach((item: any, app: any) => {
        if (!allMetrics[key]) {
          allMetrics[key] = [];
        }
        allMetrics[key].push(item.metricname); // Push the new item to the array
      });
    }

    // TODO
    // delete allMetrics["timeline_metric_store_watcher"];
    // delete allMetrics["amssmoketestfake"];
    return { components, allMetrics }
  }

  async generateHostsOptions() {
    let compToHostMap: { [key: string]: any[] } = {};
    const res = await this.request('/ws/v1/timeline/metrics/hosts')
    let data: any = res.data;
    for (let hostName in data) {
      data[hostName].forEach((component: any) => {
        if (!compToHostMap[component]) {
          compToHostMap[component] = [];
        }
        compToHostMap[component].push(hostName);
      });
    }
    return { compToHostMap }
  }

  // query(options: DataQueryRequest<AMSQuery>): Observable<DataQueryResponse> {
  //   const { range } = options;
  //   const from = range!.from.valueOf();
  //   const to = range!.to.valueOf();

  //   // Return a constant for each query.
  //   const data = options.targets.map((target) => {
  //     const frame: DataFrame = {
  //       refId: target.refId,
  //       fields: [
  //         {
  //           name: 'Time', values: [from, to], type: FieldType.time,
  //           config: {} // Assign an empty object to the config property
  //         },
  //         {
  //           name: 'Test', values: [target.constant, target.constant], type: FieldType.number,
  //           config: {}
  //         },
  //       ],
  //       length: 2,
  //     };
  //     return frame;
  //   });

  //   return new Observable<DataQueryResponse>(observer => {
  //     observer.next({ data });
  //     observer.complete();
  //   });
  // }
  async query(options: DataQueryRequest<AMSQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();
    const templateSrv = getTemplateSrv();

    const templateVariables = getTemplateSrv().getVariables();
    // const query = getTemplateSrv().replace(options.targets[0].hosts, options.scopedVars);
    // console.log(query)

    let templatedHosts = templateSrv.getVariables().filter(function (o: any) { return o.name === "hosts"; });
    // @ts-ignore
    let templatedHost = (_.isEmpty(templatedHosts)) ? '' : templatedHosts[0].options.filter(function (host: any) { return host.selected; }).map(function (hostName: any) { return hostName.value; });


    const getHostAppIdData = async (target: AMSQuery) => {
      const params = buildParams(target);
      const res = await this.request('/ws/v1/timeline/metrics', params)
      // res.data.metrics = [];
      return getMetricsData(target, res);
    };

    const buildParams = (target: AMSQuery) => {
      let metric = typeof target.metric === 'undefined' ? '' : target.metric;
      let hosts = typeof target.hosts === 'undefined' ? '' : target.hosts;
      let component = typeof target.component === 'undefined' ? '' : target.component;
      let precision = typeof target.precision === 'undefined' ? '' : target.precision.value === 'default' || typeof target.precision.value === 'undefined' ? '' : '&precision=' + target.precision.value;
      let metricAggregator = typeof target.aggregator === 'undefined' ? '' : target.aggregator.value === "none" ? '' : '._' + target.aggregator.value;
      let rate = typeof target.transform === 'undefined' ? '' : target.transform.value === "rate" ? '._rate' : '';

      let result = 'metricNames=' + metric + rate + metricAggregator + "&hostname=" + hosts + '&appId=' + component + '&startTime=' + from + '&endTime=' + to + precision
      return result;
    }

    const getServiceAppIdData = async (target: AMSQuery) => {
      // var tHost = (_.isEmpty(templateSrv.getVariables())) ? templatedHost : target.templatedHost;
      let hosts = '';//typeof target.hosts === 'undefined' ? '' : target.hosts.value;
      let metric = typeof target.metric === 'undefined' ? '' : target.metric;
      let component = typeof target.component === 'undefined' ? '' : target.component;
      let precision = typeof target.precision === 'undefined' ? '' : target.precision.value === 'default' || typeof target.precision.value === 'undefined' ? '' : '&precision=' + target.precision.value;
      let metricAggregator = typeof target.aggregator === 'undefined' ? '' : target.aggregator.value === "none" ? '' : '._' + target.aggregator.value;
      let rate = typeof target.transform === 'undefined' ? '' : target.transform.value === "rate" ? '._rate' : '';
      // return getBackendSrv().get(this.baseUrl + '/ws/v1/timeline/metrics?metricNames=' + target.metric + rate
      //   + metricAggregator + '&hostname=' + tHost + '&appId=' + target.component + '&startTime=' + from +
      //   '&endTime=' + to + precision).then(
      //     getMetricsData(target)
      //   );
      let result = 'metricNames=' + metric + rate + metricAggregator + "&hostname=" + hosts + '&appId=' + component + '&startTime=' + from + '&endTime=' + to + precision
      // const params = buildParams(target);
      const res = await this.request('/ws/v1/timeline/metrics', result)
      return getMetricsData(target, res);
    };

    // options.range.from = res.data.metrics[0].starttime;


    const getMetricsData = (target: AMSQuery, res: any) => {
      let alias = target.alias ? target.alias : typeof target.metric === 'undefined' ? '' : target.metric;
      let hostLegend = '';
      if (res.data.metrics.length > 0) {
        hostLegend = res.data.metrics[0].hostname ? ' on ' + res.data.metrics[0].hostname : ''
      }

      let legend = alias + hostLegend;
      const frame = new MutableDataFrame({
        refId: target.refId,
        length: 2,
        fields: [
          { name: 'time', type: FieldType.time },
          { name: legend, type: FieldType.number }
        ],
      });

      if (!res.data.metrics[0] || target.hide) {
        return frame;
      }
      const metricData = res.data.metrics[0].metrics;
      for (let k in metricData) {
        if (metricData.hasOwnProperty(k)) {
          frame.add(
            {
              time: (Number(k) - Number(k) % 1000),
              [legend]: metricData[k]
            }
          );
        }
      }
      return frame;

      //pending
      // if (!_.isEmpty(templateSrv.getVariables()) && templateSrv.getVariables()[0].query === "yarnqueues") {
      //   alias = alias + ' on ' + target.metric;
      // }
    };

    //YARN specific dashboards only.
    const getYarnAppIdData = async (target: AMSQuery) => {
      let precision = typeof target.precision === 'undefined' ? '' : target.precision.value === 'default' || typeof target.precision.value === 'undefined' ? '' : '&precision=' + target.precision.value;
      let metricAggregator = typeof target.aggregator === 'undefined' ? '' : target.aggregator.value === "none" ? '' : '._' + target.aggregator.value;
      let rate = typeof target.transform === 'undefined' ? '' : target.transform.value === "rate" ? '._rate' : '';
      let queue = ""
      let result = 'metricNames=' + queue + rate + metricAggregator + '&appId=resourcemanager&&startTime=' + from + '&endTime=' + to + precision
      const res = await this.request('/ws/v1/timeline/metrics', result)
      return getMetricsData(target, res);

      // return backendSrv.get(self.url + '/ws/v1/timeline/metrics?metricNames=' + target.queue + rate
      //   + metricAggregator + '&appId=resourcemanager&startTime=' + from +
      //   '&endTime=' + to + precision).then(
      //     getMetricsData(target)
      //   );
    };

    const getAllHostData = async (target: AMSQuery) => {
      let metric = typeof target.metric === 'undefined' ? '' : target.metric;
      let precision = typeof target.precision === 'undefined' ? '' : target.precision.value === 'default' || typeof target.precision.value === 'undefined' ? '' : '&precision=' + target.precision.value;
      let metricAggregator = typeof target.aggregator === 'undefined' ? '' : target.aggregator.value === "none" ? '' : '._' + target.aggregator.value;
      let rate = typeof target.transform === 'undefined' ? '' : target.transform.value === "rate" ? '._rate' : '';
      let templatedComponent = "" //(_.isEmpty(tComponent)) ? target.app : tComponent;
      // see orginal query
      let hosts = '';//typeof target.hosts === 'undefined' ? '' : target.hosts.value;

      let result = 'metricNames=' + metric + rate + metricAggregator + "&hostname=" + hosts + '&appId=' + templatedComponent + '&startTime=' + from + '&endTime=' + to + precision
      const res = await this.request('/ws/v1/timeline/metrics', result)
      return getMetricsData(target, res);

      // return backendSrv.get(self.url + '/ws/v1/timeline/metrics?metricNames=' + target.metric + rate
      //   + metricAggregator + '&hostname=' + target.templatedHost + '&appId=' + templatedComponent + '&startTime=' + from +
      //   '&endTime=' + to + precision).then(
      //     allHostMetricsData(target)
      //   );
    };

    let metricsPromises = [];
    metricsPromises = _.map(options.targets, function (target) {
      if (!!target.hosts) {
        return getHostAppIdData(target);
      } else {
        return getServiceAppIdData(target);
      }
    });

    let result = Promise.all(metricsPromises).then(function (metricsDataArray: any) {
      let data = metricsDataArray.map(function (metricsData: any) {
        return metricsData;
      });
      let metricsDataResult = { data: data.flat() };
      return Promise.resolve(metricsDataResult);
    });

    const data = await result;
    return data
  }



  // async allHostMetricsData(target: any) {
  //   const res = await this.request('/health')

  //   if (!res.data.metrics[0] || target.hide) {
  //     return [];
  //   }

  //   const series = res.data.metrics.map((data: any) => {
  //     const timeSeries = {
  //       target: (target.alias || target.metric) + ' on ' + data.hostname,
  //       datapoints: Object.entries(data.metrics).map(([k, v]) => [v, (k - k % 1000)]),
  //     };
  //     return timeSeries;
  //   });
  //   return series;
  // }

  async request(url: string, params?: string) {
    const response = getBackendSrv().fetch<DataSourceResponse>({
      url: `${this.baseUrl}${url}${params?.length ? `?${params}` : ''}`,
    });
    return lastValueFrom(response);
  }

  /**
   * Checks whether we can connect to the API.
   */
  async testDatasource() {
    const defaultErrorMessage = 'Cannot connect to APIs';

    try {
      const response = await this.request('/ws/v1/timeline/metrics/metadata');
      if (response.status === 200) {
        return {
          status: 'success',
          message: 'Success',
        };
      } else {
        return {
          status: 'error',
          message: response.statusText ? response.statusText : defaultErrorMessage,
        };
      }
    } catch (err) {
      let message = '';
      if (_.isString(err)) {
        message = err;
      } else if (isFetchError(err)) {
        message = 'Fetch error: ' + (err.statusText ? err.statusText : defaultErrorMessage);
        if (err.data && err.data.error && err.data.error.code) {
          message += ': ' + err.data.error.code + '. ' + err.data.error.message;
        }
      }
      return {
        status: 'error',
        message,
      };
    }
  }
}
