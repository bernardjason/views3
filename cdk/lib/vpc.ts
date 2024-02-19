import {
    SubnetType,
    Vpc,
  } from 'aws-cdk-lib/aws-ec2';
  import { Construct } from 'constructs';
  
  export class VPCResources extends Construct {
    public vpc: Vpc;
  
    constructor(scope: Construct, id: string) {
      super(scope, id);
  
      this.vpc = new Vpc(this, 'vpc', {
        natGateways: 0,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'ServerPublic',
            subnetType: SubnetType.PUBLIC,
            mapPublicIpOnLaunch: true,
          },
        ],
        maxAzs: 1,
      });
  
    }
  }
  