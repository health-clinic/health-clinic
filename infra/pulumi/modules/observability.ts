import * as aws from '@pulumi/aws';
import { cluster } from './cluster';
import { logGroup, service } from './service';

new aws.cloudwatch.MetricAlarm('health-clinic-cpu-alarm', {
  alarmName: 'high-cpu-health-clinic-app',
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricName: 'CPUUtilization',
  namespace: 'AWS/ECS',
  period: 60,
  statistic: 'Average',
  threshold: 80,
  dimensions: {
    ClusterName: cluster.cluster.name,
    ServiceName: service.service.name,
  },
  alarmDescription: 'High CPU usage in ECS Fargate app',
  treatMissingData: 'notBreaching',
});

new aws.cloudwatch.MetricFilter('ecs-error-filter', {
  name: 'ECSAppErrors',
  logGroupName: logGroup.name,
  pattern: 'ERROR',
  metricTransformations: [
    {
      name: 'ErrorCount',
      namespace: 'HealthClinicApp',
      value: '1',
    },
  ],
});
