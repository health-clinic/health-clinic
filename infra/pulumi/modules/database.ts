import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { databasePassword as password, databaseUsername as username } from '../shared/config';
import { subnetIds, vpcId } from './vpc';
import { TAGS } from '../shared/constants';

const name = 'health_clinic';

const subnetGroup = new aws.rds.SubnetGroup('health-clinic-database-subnet-group', {
  subnetIds,
});

const securityGroup = new aws.ec2.SecurityGroup('health-clinic-database-security-group', {
  vpcId,
  ingress: [{ protocol: 'tcp', fromPort: 5432, toPort: 5432, cidrBlocks: ['10.0.0.0/16'] }],
  egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
});

export const database = new aws.rds.Instance('health-clinic-database', {
  engine: 'postgres',
  engineVersion: '15.5',
  instanceClass: 'db.t3.micro',
  allocatedStorage: 20,
  dbName: name,
  username,
  password,
  dbSubnetGroupName: subnetGroup.name,
  vpcSecurityGroupIds: [securityGroup.id],
  skipFinalSnapshot: true,
  publiclyAccessible: false,
  tags: TAGS,
});

export const parameters = new aws.ssm.Parameter('health-clinic-database-url', {
  name: '/ECS/TaskDefinition/health-clinic-app/DATABASE_URL',
  type: 'SecureString',
  value: pulumi.interpolate`postgresql://${username}:${password}@${database.address}:5432/${name}`,
  tags: TAGS,
});
