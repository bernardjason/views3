
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';



import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import S3Buckets from './s3buckets';


export class CloudfrontResources extends Construct {
    cloudfront: CloudFrontToS3;
    constructor(scope: Construct, id: string,s3buckets: S3Buckets) {
        super(scope, id);

        this.cloudfront = new CloudFrontToS3(this, id, {
            existingBucketObj:s3buckets.websiteBucket,
            insertHttpSecurityHeaders:false,
            responseHeadersPolicyProps: {
              securityHeadersBehavior:{
                contentSecurityPolicy:{
                  contentSecurityPolicy:"default-src 'self' "+
                                        "cognito-idp.eu-west-2.amazonaws.com cognito-identity.eu-west-2.amazonaws.com *.s3.eu-west-2.amazonaws.com ; "+
                                        "default-img 'self' ; img-src 'self' data: *.s3.eu-west-2.amazonaws.com;",
                  override:true
                }
              },                  
            }
          });

    }
}