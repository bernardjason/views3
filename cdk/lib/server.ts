/* eslint-disable import/no-extraneous-dependencies */
import { AutoScalingGroup, HealthCheck } from 'aws-cdk-lib/aws-autoscaling';
import {
  Vpc,
  SecurityGroup,
  InstanceType,
  InstanceClass,
  InstanceSize,
  UserData,
  MachineImage,
  AmazonLinuxCpuType,
  Peer,
  Port,
  CfnEIP,
  LaunchTemplate,
} from 'aws-cdk-lib/aws-ec2';
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';


export class ServerResources extends Construct {
  public elasticIp: CfnEIP;
  constructor(scope: Construct, id: string, vpc: Vpc,bucketAndProfile:string, bucket:string,userName:string,userPassword:string) {
    super(scope, id);

    const serverRole = new Role(this, 'serverEc2role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        ['RetentionPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['logs:PutRetentionPolicy'],
            }),
          ],
        }),
        ['S3Ec2']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: [                
                `arn:aws:s3:::${bucket}`,
                `arn:aws:s3:::${bucket}/*`,         
              ],
              actions: ['s3:*'],
            },
            ),
            new PolicyStatement({
              resources: ["*"],
              actions: ['ec2:DescribeAddresses','ec2:AssociateAddress'],
            },
            ),
          ],
          
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),   /* NOT USED? */
      ],
    });

    const userData = UserData.forLinux();

    const whereScript = readFileSync("lib/generic.sh", 'utf8').
          replace(/\$/g,"\\$")

   const userDataText = readFileSync("lib/userdata.txt", 'utf8').          
          replace(/BUCKET_AND_PROFILE/g,bucketAndProfile).
          replace(/CAMERA_USER/g,userName).
          replace(/CAMERA_PASSWORD/g,userPassword).
          replace(/WHERESCRIPT/g,whereScript);
    
    userData.addCommands(userDataText);

    const ec2InstanceSecurityGroup = new SecurityGroup(
      this,
      'ec2InstanceSecurityGroup',
      { vpc: vpc, allowAllOutbound: true },
    );
    ec2InstanceSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(21), 'ftp');
    ec2InstanceSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcpRange(10000,10100), 'ftpaccept');

    const launchTemplate = new LaunchTemplate(this, 'LaunchTemplate', {
      machineImage: MachineImage.latestAmazonLinux2({        
        cpuType:AmazonLinuxCpuType.ARM_64,                
        userData:userData,                
        
      }),
      instanceType: InstanceType.of(
        InstanceClass.T4G,
        InstanceSize.NANO,        
      ),
      securityGroup: ec2InstanceSecurityGroup,
      role:serverRole      
    });
    
    this.elasticIp = new CfnEIP(this, "Ip",{
      tags:[
          { key:"Name",  value:"views3"   }
      ]
    });

    const applicationAutoScalingGroup = new AutoScalingGroup(this, "AutoScalingGroup", {
      vpc: vpc,
      launchTemplate:launchTemplate,
      allowAllOutbound: false,
      maxCapacity: 1,
      minCapacity: 1,
      desiredCapacity: 1,      
      healthCheck: HealthCheck.ec2(),
      
    });

    
  }
}
