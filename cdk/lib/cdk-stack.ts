import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VPCResources } from './vpc';
import { ServerResources } from './server';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy, Duration, Stack, Tags } from 'aws-cdk-lib';
import { Bucket, HttpMethods, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { Source, BucketDeployment } from 'aws-cdk-lib/aws-s3-deployment';
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  FederatedPrincipal,
} from 'aws-cdk-lib/aws-iam';

import {
 Distribution,
} from 'aws-cdk-lib/aws-cloudfront';

import * as customResources from 'aws-cdk-lib/custom-resources';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { PatchManager } from './patch';
import { fstat, readFileSync } from 'fs';
import S3Buckets from './s3buckets';
import CognitoResources from './cognito';
import { CloudfrontResources } from './cloudfront';


const KEEP_FILES_FOR_SIXTY_DAYS = 60

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const views3Properties = readFileSync("views3.properties","utf-8")
    for(let l of views3Properties.split("\n")) {
      const nv = l.split("=",2)
      this.node.setContext(nv[0],nv[1])
      console.log(`name [${nv[0]}] values [${nv[1]}]`)
    }

    const userName = this.node.getContext("userName")
    const userPassword = this.node.getContext("userPassword")
    const bucketPrefix = this.node.getContext("bucketPrefix")

    Tags.of(this).add('views3', 'true');

    const s3buckets = new S3Buckets(this,"views3-s3buckets",bucketPrefix,userName,KEEP_FILES_FOR_SIXTY_DAYS)

    const vpcResources = new VPCResources(this, 'views3-vpc');
    
    const serverResources = new ServerResources(this, 'views3-ec2',vpcResources.vpc,
              `${s3buckets.userBucket.bucketName}`, s3buckets.userBucket.bucketName,userName,userPassword);
    
    new PatchManager(this,"views3-patchmanager" )


    const cloudfront = new CloudfrontResources(this,"views3-cloudfront",s3buckets)
    
    const cognito = new CognitoResources(this,"views3-cognito",cloudfront.cloudfront,s3buckets)

    
    new cdk.CfnOutput(this, 'CognitoId', {   value: `const CognitoId = "${cognito.userpool.userPoolProviderUrl}"` });
    new cdk.CfnOutput(this, 'ClientId', {   value: `const ClientId = '${cognito.client.userPoolClientId}'`    });
    new cdk.CfnOutput(this, 'UserPoolId', {   value: `const UserPoolId = '${cognito.userpool.userPoolId}'`    });
    new cdk.CfnOutput(this, 'Cognito', {   value: `const Cognito = '${cognito.domain.baseUrl()}'`    });
    new cdk.CfnOutput(this, 'IdentityPoolId', {   value: `const IdentityPoolId = '${cognito.identityPool.ref}'`    });
    new cdk.CfnOutput(this, 'CallBackUrl',{ value:`const CallBackUrl='https://${cloudfront.cloudfront.cloudFrontWebDistribution.domainName}/'`})
    new cdk.CfnOutput(this, 'userBucketOutput',{ value:`const userBucket='${s3buckets.userBucket.bucketName}'`})
    new cdk.CfnOutput(this, 'userMappedToBucketOutput',{ value:`const userMappedToBucket='${s3buckets.userMappedToBucket.bucketName}'`})
    new cdk.CfnOutput(this, 'elasticIp',{ value:`${serverResources.elasticIp.attrPublicIp}`})
    new cdk.CfnOutput(this, 'cloudfront',{ value:`https://${cloudfront.cloudfront.cloudFrontWebDistribution.distributionDomainName}`})
  
  }



}
