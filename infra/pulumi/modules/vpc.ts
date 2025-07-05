import * as awsx from "@pulumi/awsx";
import { TAGS } from "../shared/constants";

export const vpc = new awsx.ec2.Vpc("clinic-vpc", {
  numberOfAvailabilityZones: 2,
  subnets: [{ type: "private" }],
  tags: TAGS,
});

export const vpcId = vpc.vpcId;
export const subnetIds = vpc.privateSubnetIds;