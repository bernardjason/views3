# ViewS3


```
mkdir client/build
cd cdk
cdk bootstrap
npm install
npm run cdk-deploy
npm run parse-client
npm run cognito-css
cd ../client
npm install
npm run build
cd ../cdk
npm run cdk-deploy
```

```
node createUser.js  demoman thedemo HelloBernard1
```

config file

```
userName=camera1,thedemo|camera2,thedemo|other,theothers
userPassword=!HelloDemo2000
bucketPrefix=hello-demo-world
```
