

import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import errorHandler from './useErrorHandler.js'

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");



async function S3AllObjects(s3client, setCompleteFileList, setRecentFileList, bucket, prefix,setFlash) {
    const files = new Map();
    const recentFiles = [];
    const last24Hours = Date.now() - 1000*60*60*24

    
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
                    const lastModified = parseInt(record.lastModified)
                    if ( lastModified >= last24Hours) {
                        recentFiles.push(record)
                    }  
                    current.push(record);
                }
            ) 
            
            console.log("Chunk "+max+"  complete") 
        }
    }
    
    try {
        const start = Date.now();
        while ( max < 999 && ContinuationToken !== undefined ) {
            max=max+1
            // , StartAfter: "thedemo/camera1/2024/02/17/"
            //const after = "thedemo/camera1/darlo.txt"
            const command = ContinuationToken === "first" ?
                 new ListObjectsV2Command({ Bucket: bucket , Prefix:prefix, MaxKeys:500 }) :            
                new ListObjectsV2Command({ Bucket: bucket , Prefix:prefix, MaxKeys:500, ContinuationToken:ContinuationToken});
            setFlash({ state:true,message:"refreshing... retrieve batch "+max})
            await s3client.send(command).then( processChunkOfFiles).catch(error => {
                console.log(JSON.stringify(error))
                errorHandler(error,"problem retrieving files")
            }) 

        }        
        const millis = Date.now() - start;

        console.log(`seconds elapsed = ${millis / 1000} Chunk processed ${max}`)
                
        //files.delete("/") // I dont want root to be available.

        /*
        for(let k of files.keys() ) {
            
            for ( let folder of files.get(k)) {

                const lastModified = parseInt(folder.lastModified)
                if ( lastModified >= last24Hours) {
                    console.log(`XXXXXXXXXXXX k ${lastModified}  ${Date.now()}  ${JSON.stringify(folder)}`)
                    recentFiles.push(folder)
                }                
            }
        }
        */
        setRecentFileList(recentFiles)        
        setFlash({state:false})
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
