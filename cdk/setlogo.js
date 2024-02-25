var fs = require('fs');

const obj = JSON.parse(fs.readFileSync('cdk-outputs.json', 'utf8'));
const image = fs.readFileSync('lib/views3.jpg')

const css = fs.readFileSync('lib/cognito.css','utf-8')

const userPoolId = obj.ViewS3.UserPoolId.replace(/^const.*= /g,"").replace(/'/g,"")
const clientId = obj.ViewS3.ClientId.replace(/^const.*= /g,"").replace(/'/g,"")
console.log(`userpoolId [${userPoolId}]   clientId [${clientId}]`)


const { CognitoIdentityProviderClient, SetUICustomizationCommand } = require("@aws-sdk/client-cognito-identity-provider"); 
const client = new CognitoIdentityProviderClient();
const input = {
  UserPoolId: userPoolId,
  ClientId: clientId,
  CSS:css,
  ImageFile: image,  
};
const command = new SetUICustomizationCommand(input);
client.send(command).then( (response) => console.log(response));
// { // SetUICustomizationResponse
//   UICustomization: { // UICustomizationType
//     UserPoolId: "STRING_VALUE",
//     ClientId: "STRING_VALUE",
//     ImageUrl: "STRING_VALUE",
//     CSS: "STRING_VALUE",
//     CSSVersion: "STRING_VALUE",
//     LastModifiedDate: new Date("TIMESTAMP"),
//     CreationDate: new Date("TIMESTAMP"),
//   },
// }