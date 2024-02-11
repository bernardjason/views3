

import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import errorHandler from './useErrorHandler.js'

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");



async function S3AllObjects(s3client, setCompleteFileList, bucket, prefix) {
    const files = new Map();
    
    let previousDirectory = "/"
    files.set(previousDirectory, []);
    let ContinuationToken = "first"
    let max = 0 ; 

    const processChunkOfFiles = (f) => {        
        ContinuationToken = f.NextContinuationToken
        if ( f.Contents !== undefined) {
            f.Contents.forEach((file) => {
                    const record = { id: file.ETag, key: file.Key, title: file.Key, content: "tbd", lastModified: `${file.LastModified.valueOf()}` };

                    const directoryStructure = file.Key.split("/");

                    let current = []
                    
                    for (let item = 0; item < directoryStructure.length -1 ; item++) {
                        
                        let directory = ""
                        for(let jj = 0 ; jj <= item ; jj++ ) {
                            const j = directoryStructure[jj];
                            const parent = directory
                            if (j.length > 0) {    
                                directory = `${directory}${j}/`;
                            }
                            current = files.get(directory);
                            if (current === undefined) {
                                current = []
                                
                                
                                if ( parent.length > 0) {
                                    files.get(parent).push({
                                        title: directory,
                                        key: directory,
                                        content: directory
                                    });
                                }
                                    
                                files.set(directory,current)
                            }
                        }                
                    }
                    current.push(record);
                }
            )        
        }
    }
    
    try {
        while ( max < 999 && ContinuationToken !== undefined ) {
            max=max+1
            const command = ContinuationToken === "first" ?
                 new ListObjectsV2Command({ Bucket: bucket , Prefix:prefix, MaxKeys:1000 }) :            
                new ListObjectsV2Command({ Bucket: bucket , Prefix:prefix, MaxKeys:1000 , ContinuationToken:ContinuationToken});
            
            await s3client.send(command).then( processChunkOfFiles).catch(error => {
                console.log(JSON.stringify(error))
                errorHandler(error,"problem retrieving files")
            })            
        }
        
        files.delete("/") // I dont want root to be available.
        for(let k of files.keys() ) {
            console.log(`${JSON.stringify(files.get(k))}`)
        }

        setCompleteFileList(files)       
    } catch (error) {
        console.log(JSON.stringify(error))
        errorHandler(error,"problem retrieving files")

    }

    
}



async function signUrl(client, fileName, bucket, expiresIn, assign) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: fileName,
    });

    return getSignedUrl(client, command, { expiresIn }).then((url) => assign(url)).catch( (error) => {
        console.log(JSON.stringify(error))
        errorHandler(error,"problem accessing files")
    })
}




export { S3AllObjects, signUrl }
