import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx/classic';
import { cluster } from './cluster';
import { image } from './ecr';
import { jwtSecret, mailtrapPass, mailtrapUser, valkeyPassword } from '../shared/config';
import { publicSubnetIds, vpcId } from './vpc';
import { APP_PORT, CPU, MEMORY, REDIS_PORT, TAGS } from '../shared/constants';

export const logGroup = new aws.cloudwatch.LogGroup('health-clinic-app-log-group', {
  name: '/ecs/health-clinic-app',
  retentionInDays: 7,
  tags: TAGS,
});

const serviceSecurityGroup = new aws.ec2.SecurityGroup('health-clinic-service-security-group', {
  vpcId,
  ingress: [
    { protocol: 'tcp', fromPort: APP_PORT, toPort: APP_PORT, cidrBlocks: ['0.0.0.0/0'] },
  ],
  egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
  tags: TAGS,
});

export const service = new awsx.ecs.FargateService('health-clinic-service', {
  cluster,
  desiredCount: 1,
  assignPublicIp: true,
  subnets: publicSubnetIds,
  securityGroups: [serviceSecurityGroup.id],
  taskDefinitionArgs: {
    containers: {
      app: {
        image: image.ref,
        cpu: CPU,
        memory: MEMORY,
        portMappings: [{ containerPort: APP_PORT }],
        environment: [
          { name: 'NODE_ENV', value: 'production' },
          { name: 'APP_PORT', value: APP_PORT.toString() },
          { name: 'VALKEY_HOST', value: 'localhost' },
          { name: 'VALKEY_PORT', value: REDIS_PORT.toString() },
          { name: 'MAILTRAP_USER', value: mailtrapUser },
          { name: 'MAILTRAP_PASS', value: mailtrapPass },
          { name: 'JWT_SECRET', value: jwtSecret },
        ],
        secrets: [
          {
            name: 'DATABASE_URL',
            valueFrom: '/ECS/TaskDefinition/health-clinic-app/DATABASE_URL',
          },
        ],
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': logGroup.name,
            'awslogs-region': 'us-east-1',
            'awslogs-stream-prefix': 'ecs',
          },
        },
      },
      valkey: {
        image: 'valkey/valkey:latest',
        cpu: 128,
        memory: 256,
        portMappings: [{ containerPort: REDIS_PORT }],
        command: ['valkey-server', '--requirepass', valkeyPassword],
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': logGroup.name,
            'awslogs-region': 'us-east-1',
            'awslogs-stream-prefix': 'ecs',
          },
        },
      },
    },
  },
  tags: TAGS,
});
