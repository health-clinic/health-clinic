import * as awsx from '@pulumi/awsx';

export const repository = new awsx.ecr.Repository('health-clinic-ecr', {
  forceDelete: true,
});

export const image = new awsx.ecr.Image('health-clinic-image', {
  repositoryUrl: repository.url,
  context: './../../',
  platform: 'linux/amd64',
});
