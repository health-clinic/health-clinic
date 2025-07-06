import * as awsx from '@pulumi/awsx';
import { TAGS } from '../shared/constants';

export const vpc = new awsx.ec2.Vpc('health-clinic-vpc', {
  numberOfAvailabilityZones: 2,
  cidrBlock: '10.0.0.0/16',
  enableDnsSupport: true,
  enableDnsHostnames: true,
  natGateways: {
    strategy: 'None',
  },
  tags: TAGS,
});

export const vpcId = vpc.vpcId;
export const privateSubnetIds = vpc.privateSubnetIds;
