var fs = require('fs');

const fromBuild = '../client/src/FromBuild.js'

const obj = JSON.parse(fs.readFileSync('cdk-outputs.json', 'utf8'));


const CognitoId = obj.ViewS3.CognitoId.replace("https:\/\/","")

const content =`
${obj.ViewS3.ClientId}
${CognitoId}
${obj.ViewS3.Cognito}
${obj.ViewS3.IdentityPoolId}
${obj.ViewS3.CallBackUrl}
${obj.ViewS3.userMappedToBucketOutput}
export {CognitoId,ClientId,Cognito,IdentityPoolId,CallBackUrl,userMappedToBucket}
`

fs.writeFileSync(fromBuild, content);
