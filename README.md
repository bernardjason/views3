# ViewS3

This project allows multiple security cameras and groups of users to log onto a website to display the videos captured by their security cameras.

<img src="docs/1.png" alt="alt text" width="40%"/> <img src="docs/2.png" alt="alt text" width="40%"/> <img src="docs/3.png" alt="alt text" width="40%"/>


An AWS stack is deployed that:
- creates a dedicated VPC    
- creates a single EC2 in the VPC that provides a location for cameras to ftp upload video/jpg to.     
- patches EC2 automatically.     
- uses Cognito for authentication of users    
- Cloudfront/S3 for a React website to view video/jpgs captured.     
- EC2 uses IPV4

<img src="docs/views3.drawio.png" alt="alt text" width="60%"/>

## prerequistes
node --version
v20.9.0
npm --version
10.1.0

## to deploy

To deploy the system create a file in cdk directory called 

views3.properties

The file must contain these values
```
userName=camera1,thedemo|camera2,thedemo|other,theothers
userPassword=!HelloDemo2000
bucketPrefix=<!!! make sure I am unique!!!>
```

where userName is a list of camera ftp usernames and the group they are in. 
userPassword is the initial password for each of the ftp users created. You will need to log onto the EC2 instance using SSM Session Manager as SSH port 22 is not enabled.

bucketPrefix. This has to be a unique name as S3 buckets have this as a prefix. 

```
mkdir client/build
cd cdk
cdk bootstrap
npm install
npm run cdk-deploy
npm run parse-client
npm run cognito-css
```

We now have to redeploy the React website as we have the details of Cloudfront/Cognito 
```
cd ../client
npm install
npm run build
cd ../cdk
npm run cdk-deploy
```

CDK output gives the front end URL and ip address cameras should upload to

<img src="docs/cdkout.png" alt="alt text" width="60%"/>


Front end users are not added by CDK, nor can users sign add themselves. They must be provisioned with a script that creates the users with an initial password.
They also get a profile set, this is used to map the user to a group. Cameras and users are in a group.

```
node createUser.js  demoman thedemo HelloBernard1
```


