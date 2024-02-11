import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as cognito from 'aws-cdk-lib/aws-cognito';
import {  Stack,  } from 'aws-cdk-lib';

import {
    Role,
    ServicePrincipal,
    ManagedPolicy,
    PolicyDocument,
    PolicyStatement,
    FederatedPrincipal,
} from 'aws-cdk-lib/aws-iam';



import * as customResources from 'aws-cdk-lib/custom-resources';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import S3Buckets from './s3buckets';



export class CognitoResources extends Construct {
    identityPool: cdk.aws_cognito.CfnIdentityPool;
    userpool: cdk.aws_cognito.UserPool;
    client: cdk.aws_cognito.UserPoolClient;
    domain: cdk.aws_cognito.UserPoolDomain;


    constructor(scope: Construct, id: string, cloudfront: CloudFrontToS3, s3buckets: S3Buckets) {
        super(scope, id);


        this.userpool = new cognito.UserPool(this, '-userpool', {
            userPoolName: id+'-user-pool',
            signInAliases: {
                email: true,
                username: true,
            },
            standardAttributes: {
                profilePage: {
                    mutable: true,
                    required: true
                }
            },
            selfSignUpEnabled: false,
            autoVerify: {
                email: true,
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        this.client = this.userpool.addClient('views3-client', {
            oAuth: {
                flows: {
                    implicitCodeGrant: true,
                },
                callbackUrls: [
                    'http://localhost:3000/',
                    `https://${cloudfront.cloudFrontWebDistribution.domainName}/`
                ],
            },
        });
        this.domain = this.userpool.addDomain('views3-domain',
            {
                cognitoDomain: {
                    domainPrefix: 'views3-domain',
                },
            });

        const signInUrl = this.domain.signInUrl(this.client, {
            redirectUri: 'http://localhost:3000/', // must be a URL configured under 'callbackUrls' with the client
        });



        this.identityPool = new cognito.CfnIdentityPool(this, '-identity-pool', {
            identityPoolName:id+"-identity-pool",
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [{
                clientId: this.client.userPoolClientId,
                providerName: this.userpool.userPoolProviderName,
            }]
        });


        const serverRole = this.createCognitoRole(this.identityPool.ref, s3buckets.userMappedToBucket, s3buckets.userBucket);


        const defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
            identityPoolId: this.identityPool.ref,
            roles: {
                'authenticated': serverRole.roleArn
            }
        });


        // thanks https://github.com/aws-samples/amazon-cognito-abac-authorization-with-react-example/blob/main/lib/cognito_identity_pool_sample-stack.ts

        const createParameters = {
            "IdentityPoolId": this.identityPool.ref,
            "IdentityProviderName": this.userpool.userPoolProviderName,
            "PrincipalTags": {
                "profile": "profile"
            },
            "UseDefaults": false
        }

        const setPrincipalTagAction = {
            action: "setPrincipalTagAttributeMap",
            service: "CognitoIdentity",
            parameters: createParameters,
            physicalResourceId: customResources.PhysicalResourceId.of(this.identityPool.ref)
        }

        const { region, account } = Stack.of(this)
        const identityPoolArn = `arn:aws:cognito-identity:${region}:${account}:identitypool/${this.identityPool.ref}`

        // Creates a Custom resource (https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources-readme.html)
        // This is necessary to attach Principal Tag mappings to the Identity Pool after it has been created.
        // This uses the SDK, rather than CDK code, as attaching Principal Tags through CDK is currently not supported yet
        new customResources.AwsCustomResource(this, 'CustomResourcePrincipalTags', {
            onCreate: setPrincipalTagAction,
            onUpdate: setPrincipalTagAction,
            policy: customResources.AwsCustomResourcePolicy.fromSdkCalls({
                resources: [identityPoolArn],
            }),
        })







    }
    private createCognitoRole(identityPoolId: string, userMappedToBucket: any, userBucket: any) {
        const cognitoPrincipal = new ServicePrincipal('cognito-identity.amazonaws.com').withSessionTags();
        const serverRole = new Role(this, 'cognitoIdenityPoolRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": {
                    "cognito-identity.amazonaws.com:aud": identityPoolId
                },
                "ForAnyValue:StringLike": {
                    "cognito-identity.amazonaws.com:amr": "authenticated"
                }
            }, "sts:AssumeRoleWithWebIdentity").withSessionTags(),
            inlinePolicies: {
                ['download']: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            resources: [`arn:aws:s3:::${userBucket.bucketName}*/\${aws:PrincipalTag/profile}/*.*`],
                            actions: ['s3:*'],
                        }),
                    ],
                }),


                ['buckets']: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            resources: [
                                `arn:aws:s3:::${userBucket.bucketName}`,
                                `arn:aws:s3:::${userBucket.bucketName}/*`
                            ],
                            actions: ["s3:ListAccessPointsForObjectLambda",
                                "s3:GetObjectVersionTagging",
                                "s3:ListStorageLensGroups",
                                "s3:GetStorageLensConfigurationTagging",
                                "s3:GetObjectAcl",
                                "s3:GetBucketObjectLockConfiguration",
                                "s3:GetIntelligentTieringConfiguration",
                                "s3:GetStorageLensGroup",
                                "s3:GetAccessGrantsInstanceForPrefix",
                                "s3:GetObjectVersionAcl",
                                "s3:GetBucketPolicyStatus",
                                "s3:GetAccessGrantsLocation",
                                "s3:GetObjectRetention",
                                "s3:GetBucketWebsite",
                                "s3:GetJobTagging",
                                "s3:ListJobs",
                                "s3:GetMultiRegionAccessPoint",
                                "s3:GetObjectAttributes", /* NOT USED ? */
                                "s3:GetAccessGrantsInstanceResourcePolicy",
                                "s3:GetObjectLegalHold",
                                "s3:GetBucketNotification",
                                "s3:DescribeMultiRegionAccessPointOperation",
                                "s3:GetReplicationConfiguration",
                                "s3:ListMultipartUploadParts",
                                "s3:DescribeJob",
                                "s3:GetAnalyticsConfiguration",
                                "s3:GetObjectVersionForReplication",
                                "s3:GetAccessPointForObjectLambda",
                                "s3:GetStorageLensDashboard",
                                "s3:GetLifecycleConfiguration",
                                "s3:GetAccessPoint",
                                "s3:GetInventoryConfiguration",
                                "s3:GetBucketTagging",
                                "s3:GetAccessPointPolicyForObjectLambda",
                                "s3:GetBucketLogging",
                                "s3:ListBucketVersions",
                                "s3:GetAccessGrant",
                                "s3:ListBucket",
                                "s3:GetAccelerateConfiguration",
                                "s3:GetObjectVersionAttributes",
                                "s3:GetBucketPolicy",
                                "s3:ListTagsForResource",
                                "s3:GetEncryptionConfiguration",
                                "s3:GetObjectVersionTorrent",
                                "s3:GetBucketRequestPayment",
                                "s3:ListAccessGrantsInstances",
                                "s3:ListAccessGrants",
                                "s3:GetAccessPointPolicyStatus",
                                "s3:GetAccessGrantsInstance",
                                "s3:GetObjectTagging",
                                "s3:GetMetricsConfiguration",
                                "s3:GetBucketOwnershipControls",
                                "s3:GetBucketPublicAccessBlock",
                                "s3:GetMultiRegionAccessPointPolicyStatus",
                                "s3:ListBucketMultipartUploads",
                                "s3:GetMultiRegionAccessPointPolicy",
                                "s3:GetAccessPointPolicyStatusForObjectLambda",
                                "s3:ListAccessPoints",
                                "s3:GetDataAccess",
                                "s3:GetBucketVersioning",
                                "s3:ListMultiRegionAccessPoints",
                                "s3:GetBucketAcl",
                                "s3:GetAccessPointConfigurationForObjectLambda",
                                "s3:ListAccessGrantsLocations",
                                "s3:ListStorageLensConfigurations",
                                "s3:GetObjectTorrent",
                                "s3:GetMultiRegionAccessPointRoutes",
                                "s3:GetStorageLensConfiguration",
                                "s3:GetAccountPublicAccessBlock",
                                "s3:ListAllMyBuckets",
                                "s3:GetBucketCORS",
                                "s3:GetBucketLocation",
                                "s3:GetAccessPointPolicy",
                                "s3:GetObjectVersion"],
                            conditions: {
                                "StringLike": {
                                    "s3:prefix": "${aws:PrincipalTag/profile}/*"
                                }
                            }
                        }),
                    ],
                }),

                ['map']: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            resources: [`arn:aws:s3:::${userMappedToBucket.bucketName}/\${aws:PrincipalTag/profile}*`],
                            actions: ['s3:*'],
                        }),
                    ],
                }),
            }
        });
        return serverRole
    }
}

/*
no point as cannot set log, use sdk
const cssfile = readFileSync("lib/cognito.css","utf-8");

const cfnUserPoolUICustomizationAttachment = new cognito.CfnUserPoolUICustomizationAttachment(this, 'MyCfnUserPoolUICustomizationAttachment', {
  clientId: client.userPoolClientId,
  userPoolId:  userpool.userPoolId  , 
  // the properties below are optional
  css: cssfile, 
});

*/



export default CognitoResources