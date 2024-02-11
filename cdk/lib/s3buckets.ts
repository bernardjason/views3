import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Bucket, HttpMethods, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { Source, BucketDeployment, ISource } from 'aws-cdk-lib/aws-s3-deployment';




export class S3Buckets extends Construct {

    public userBucket : cdk.aws_s3.Bucket;
    public websiteBucket: cdk.aws_s3.Bucket;
    public userMappedToBucket:cdk.aws_s3.Bucket;

    constructor(scope: Construct, id: string, bucketPrefix: string, userNames: string, daysToKeepFiles:number) {
        super(scope, id);

            this.websiteBucket = new Bucket(this, 'websiteBucket', {
              bucketName: `${bucketPrefix}-cdk-folder-website`,
              publicReadAccess: false,
              removalPolicy: RemovalPolicy.DESTROY,
              objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
              autoDeleteObjects: true,
            });
        
            // Deploy the local assets to the Asset Bucket during the CDK deployment
            new BucketDeployment(this, 'websiteBucketBucketDeployment', {
              sources: [Source.asset('../client/build')],
              destinationBucket: this.websiteBucket,
              retainOnDelete: false,
              memoryLimit: 512,
            });
        
            this.userMappedToBucket = new Bucket(this, 'userMappedBucket', {
              bucketName: `${bucketPrefix}-cdk-folder-mapped`,
              publicReadAccess: false,
              removalPolicy: RemovalPolicy.DESTROY,
              objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
              autoDeleteObjects: true,
              cors: [{
                allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
                allowedOrigins: ["*"],
                allowedHeaders: ['*'],
                exposedHeaders: [],
              }]
            });
            this.userBucket = new Bucket(this, 'userBucket', {
              bucketName: `${bucketPrefix}-cdk-folder-user`,
              publicReadAccess: false,
              removalPolicy: RemovalPolicy.DESTROY,
              objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
              autoDeleteObjects: true,
              lifecycleRules:[
                {
                    id:"deleteoldfiles",
                    expiration:Duration.days(daysToKeepFiles),
                }
              ],
              cors: [{
                allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
                allowedOrigins: ["*"],
                allowedHeaders: ['*'],
                exposedHeaders: [],
              }]
            });
            
            type ObjectType = {
              [key: string]: ISource
            }
            let profiles:ObjectType = {}

            for(let userAndProfile of userNames.split("|")) {
              const splitUserAndProfile=userAndProfile.split(",")
              const profile = `${splitUserAndProfile[1]}`
              profiles[profile] = Source.data(`${profile}.txt`, this.userBucket.bucketName)
            }
            const sources:ISource[] = []
            for(let profile in profiles) {
              sources.push(profiles[profile])
            }
            new BucketDeployment(this, `mapUserToBucket`, {                
                sources: sources,
                destinationBucket: this.userMappedToBucket,
                destinationKeyPrefix: "/",
                retainOnDelete: true,
                memoryLimit: 512,
            });
            
            
     
          }
    
}

export default S3Buckets