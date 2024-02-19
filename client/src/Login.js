import { useCallback, useEffect } from "react";

import { S3Client , GetObjectCommand} from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool ,  } from "@aws-sdk/credential-providers";
import {  CognitoIdentityProviderClient , GetUserCommand  } from "@aws-sdk/client-cognito-identity-provider";
import errorHandler from './useErrorHandler.js'
import {Cognito, ClientId, CognitoId,IdentityPoolId, CallBackUrl, userMappedToBucket} from './FromBuild.js'

const REGION = 'eu-west-2'


function authenticateWithCognito() {
    var loginUrl = CallBackUrl // CallBackUrl // 'http://localhost:3000/'

    // only for dev!
    try {
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            loginUrl = 'http://localhost:3000/'        
        }
    } catch (err) {
    }
    const url = Cognito + '/login?client_id=' + ClientId + '&response_type=token&redirect_uri=' + loginUrl;
    window.location.replace(url);
}

function logoutFromCognito() {
    setCookie('authorization', "", 0);
    const url='/';
    window.location.replace( url );
    

}
function setCookie(cname, cvalue, hours) {
    const d = new Date();
    d.setTime(d.getTime() + (hours * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function Login(setAccessToken, setS3Client,setBucketList,setBucket) {
    const getToken = useCallback( () => {
        var idtoken = window.location.href.split("#id_token=");
        if (idtoken.length > 1) {
            var idtoken1 = idtoken[1].split('=')[0].split('&')[0];
            var access_token = idtoken[1].split("access_token=")[1].split('&')[0];
            setCookie('authorization', access_token, 1);

            const bucketInformation = { bucket:null , prefix:null, previous:null , profile:null}
            
           
            let loginData = {
                [CognitoId]: idtoken1,
            }


            let loginSoFar = { isLoggedIn:true, 
                access_token: access_token, 
                id_token: idtoken1,
                loginData : loginData,
                //identityId:identityId
            }
            setAccessToken(loginSoFar );
                const s3Client = new S3Client({
                    region: REGION,
                    credentials: fromCognitoIdentityPool({
                        clientConfig: { region: REGION }, // Configure the underlying CognitoIdentityClient.
                        identityPoolId:IdentityPoolId,
                        logins: loginData
                    })
                });
            setS3Client(s3Client)
            
            const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
                region: REGION,
                credentials: fromCognitoIdentityPool({
                    clientConfig: { region: REGION }, // Configure the underlying CognitoIdentityClient.
                    identityPoolId:IdentityPoolId,
                    logins: loginData
                    }
                    )
                }
            );

            cognitoIdentityProviderClient.send(new GetUserCommand( {AccessToken: access_token})).then((response) => { 
                //console.log("DETAILS "+JSON.stringify(response))

                var profile="none"
                loginSoFar.userName = response.Username                        
                setAccessToken(loginSoFar );        
                for( let attribute of response.UserAttributes){
                    if ( attribute.Name === "profile") {
                        profile=attribute.Value
                        bucketInformation.prefix=`${profile}/`
                        bucketInformation.previous=`${profile}/`
                        bucketInformation.profile=`${profile}/`
                    }
                }
                            
                const bucketInput = {
                    Bucket: userMappedToBucket,
                    Key: `${profile}.txt`
                }
                const getMyBuckets = new GetObjectCommand(bucketInput);                
            
                s3Client.send(getMyBuckets).then( (response) => {
                    response.Body.transformToString().then( (response) => {                        
                        const theBuckets = response.split("\n")                                           
                        setBucketList(theBuckets)                                                
                        bucketInformation.bucket = theBuckets[0] 
                        
                        setBucket(bucketInformation)             
                    })                        
                }).catch( (error) => {
                    console.log(JSON.stringify(error))
                    errorHandler(error,"problem accessing your profile mapping")
                })


            }).catch( (error) => {
                console.log(JSON.stringify(error))
                errorHandler(error,"problem logging on")
            });
            //})
        } 
    }
    , [setAccessToken, setS3Client , setBucket , setBucketList] )
    useEffect(() => getToken(), [getToken]);

    return 


    
}
export {authenticateWithCognito, Login , logoutFromCognito}
