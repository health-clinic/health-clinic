import * as aws from '@pulumi/aws';
import { cluster } from './cluster';
import { service } from './service';

new aws.cloudwatch.MetricAlarm('health-clinic-cpu-alarm', {
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricName: 'CPUUtilization',
  namespace: 'AWS/ECS',
  period: 60,
  statistic: 'Average',
  threshold: 80,
  dimensions: {
    ClusterName: cluster.cluster.name,
    ServiceName: service.name,
  },
  alarmDescription: 'High CPU usage in ECS Fargate app',
  treatMissingData: 'notBreaching',
});
