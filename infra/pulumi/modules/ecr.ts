import * as awsx from '@pulumi/awsx/classic';
import * as aws from '@pulumi/aws';
import * as docker from '@pulumi/docker-build';

export const ecr = new awsx.ecr.Repository('health-clinic-ecr-repo');

const { username, password } = aws.ecr.getAuthorizationTokenOutput({
  registryId: ecr.repository.registryId,
});

export const image = new docker.Image('health-clinic-app-image', {
  context: './../../../',
  platforms: ['linux/amd64'],
  push: true,
  registries: [
    {
      address: ecr.repository.repositoryUrl,
      username,
      password,
    },
  ],
  tags: [ecr.repository.repositoryUrl.apply((url: any): string => `${url}:latest`)],
});
