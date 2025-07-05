import * as awsx from '@pulumi/awsx/classic';

export const cluster = new awsx.ecs.Cluster('health-clinic-cluster');
