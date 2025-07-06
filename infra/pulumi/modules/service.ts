import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
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
  ingress: [{ protocol: 'tcp', fromPort: APP_PORT, toPort: APP_PORT, cidrBlocks: ['0.0.0.0/0'] }],
  egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
  tags: TAGS,
});

const taskRole = new aws.iam.Role('health-clinic-task-role', {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: 'ecs-tasks.amazonaws.com' }),
});

const executionRole = new aws.iam.Role('health-clinic-execution-role', {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: 'ecs-tasks.amazonaws.com' }),
});

new aws.iam.RolePolicyAttachment('health-clinic-execution-policy', {
  role: executionRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

const taskDefinition = new aws.ecs.TaskDefinition('health-clinic-task-definition', {
  family: 'health-clinic-task',
  cpu: CPU.toString(),
  memory: MEMORY.toString(),
  networkMode: 'awsvpc',
  requiresCompatibilities: ['FARGATE'],
  executionRoleArn: executionRole.arn,
  taskRoleArn: taskRole.arn,
  containerDefinitions: pulumi
    .all([logGroup.name, valkeyPassword])
    .apply(([logGroupName, redisPass]) =>
      JSON.stringify([
        {
          name: 'app',
          image: image.ref,
          essential: true,
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
              'awslogs-group': logGroupName,
              'awslogs-region': 'us-east-1',
              'awslogs-stream-prefix': 'ecs',
            },
          },
        },
        {
          name: 'valkey',
          image: 'valkey/valkey:latest',
          essential: false,
          cpu: 128,
          memory: 256,
          portMappings: [{ containerPort: REDIS_PORT }],
          command: ['valkey-server', '--requirepass', redisPass],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroupName,
              'awslogs-region': 'us-east-1',
              'awslogs-stream-prefix': 'ecs',
            },
          },
        },
      ]),
    ),
});

export const service = new aws.ecs.Service('health-clinic-service', {
  cluster: cluster.cluster.arn,
  desiredCount: 1,
  launchType: 'FARGATE',
  taskDefinition: taskDefinition.arn,
  networkConfiguration: {
    subnets: publicSubnetIds,
    securityGroups: [serviceSecurityGroup.id],
    assignPublicIp: true,
  },
  tags: TAGS,
});
