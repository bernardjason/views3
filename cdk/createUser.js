var fs = require('fs');
var cognito = require('@aws-sdk/client-cognito-identity-provider');
const { exit } = require('process');

var args = process.argv.slice(2);
const userName = args[0]
const profile = args[1]
const initialPassword = args[2]
console.log(`username ${userName}  profile ${profile} default password ${initialPassword}`)

if ( userName === undefined || profile === undefined || initialPassword===undefined) {
  console.log("Require params <username>  <profile>  <initial password>")
  exit(1)
}

var obj = JSON.parse(fs.readFileSync('cdk-outputs.json', 'utf8'));
console.log(`${obj.ViewS3.CognitoId}`)
const CognitoId = obj.ViewS3.CognitoId.replace(/^const.*.com\//i,"").replace('"',"")

console.log(CognitoId)
const input = {
    
    "TemporaryPassword": initialPassword,
    "UserAttributes": [
      {
        "Name": "profile",
        "Value": profile
      },
    
    ],
    "UserPoolId": `${CognitoId}`,
    "Username": userName
  };
  
  const command = new cognito.AdminCreateUserCommand(input);
  new cognito.CognitoIdentityProviderClient().send(command);
