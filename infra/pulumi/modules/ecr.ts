import * as awsx from '@pulumi/awsx/classic';
import * as aws from '@pulumi/aws';
import * as docker from '@pulumi/docker-build';
import * as pulumi from '@pulumi/pulumi';

export const ecr = new awsx.ecr.Repository('health-clinic-ecr');

const authorization = aws.ecr.getAuthorizationTokenOutput({
  registryId: ecr.repository.registryId,
});

export const image = new docker.Image('health-clinic-image', {
  context: { location: './../../' },
  dockerfile: { location: './../../Dockerfile' },
  platforms: ['linux/amd64'],
  push: true,
  registries: [
    pulumi.all([ecr.repository.repositoryUrl, authorization]).apply(([url, token]) => {
      const [username, password] = Buffer.from(token.authorizationToken, 'base64')
        .toString('utf8')
        .split(':');

      return {
        address: url,
        username,
        password,
      };
    }),
  ],
  tags: [ecr.repository.repositoryUrl.apply((url: any): string => `${url}:latest`)],
});
