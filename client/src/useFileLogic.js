import './App.css';
import {  useState ,  useEffect, useCallback  } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

import { S3AllObjects,  } from './S3AllObjects.js';
import errorHandler from './useErrorHandler.js'


function useFileLogic(s3client,firstBucket,bucket,setFlash) {

    const [completeFileList,setCompleteFileList] = useState( new Map() )
    
    const [fileList, setFileList] = useState([]);

    const [recentFileList, setRecentFileList] = useState([]);

    const refreshFiles  = () => {    
        console.log(`Refresh files ${JSON.stringify(bucket)}`)
        S3AllObjects(s3client, setCompleteFileList, setRecentFileList, bucket.bucket,bucket.profile,setFlash).catch(error => {
            console.log(JSON.stringify(error))
            errorHandler(error,"problem with refresh action")
        })            
    } 

    useEffect( () => {
        if ( s3client != null && bucket.bucket != null && firstBucket !== undefined ) {

            S3AllObjects(s3client, setCompleteFileList, setRecentFileList, firstBucket, bucket.prefix,setFlash).catch(error => {            
                console.log(JSON.stringify(error))
                errorHandler(error,"problem getting list of files")
            })
        }
        }, [s3client, firstBucket, bucket, setFlash] )
    
    const  setupParent = useCallback( (current) => {
        let elements = bucket.prefix.split("/");
        elements.pop(); // get rid of first / which is now ""
        elements.pop();

        let parent = elements.join("/") + "/";
        // DONT WANT TO GO TO /
        if ( parent !== "/" ) {       
            bucket.previous = parent;
            bucket.prefix = current;
        }
    },[bucket]
    )

    function goUpToParent() {
        setupParent(bucket.previous)
        changeUpdateDirectoryList(completeFileList)
    }



    const changeUpdateDirectoryList = useCallback( () => {

        console.log(`changeUpdateDirectoryList [${bucket.prefix}]`)
        let fileListing = [];
        if (completeFileList && completeFileList.get(bucket.prefix) !== undefined) {

            for (let value of completeFileList.get(bucket.prefix)) {
                if ( value.key === bucket.prefix ) {
                    console.log(`changeUpdateDirectoryList SKIP ITSELF [${JSON.stringify(value)}]`)
                } else {
                    console.log(`changeUpdateDirectoryList [${JSON.stringify(value)}]`)
                    fileListing.push(value);
                }
                
                
            }
        }
        //fileListing.shift() // dont show directory name
        setupParent(bucket.prefix)
        setFileList(fileListing)
    } , [bucket.prefix, completeFileList, setupParent]
    )

    useEffect(() => {changeUpdateDirectoryList()}, [completeFileList , changeUpdateDirectoryList]);   

    return [goUpToParent,changeUpdateDirectoryList , refreshFiles , fileList , recentFileList ]
}

export default useFileLogic
