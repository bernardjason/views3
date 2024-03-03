import './App.css';

import {  signUrl } from './S3AllObjects.js';


function onClickS3Object(what, key,big , s3client , bucket, setFullscreenModal , setNormalModal , changeUpdateDirectoryList) {
    
    if (key.endsWith(".png") || key.endsWith(".jpg") ) {
        
        signUrl(s3client, key, bucket.bucket, 30, (url) => {
            console.log(url)
            for(let t of document.getElementsByClassName("modalview")) {
                t.innerHTML = `<image class="imageSelected" src=${url}></image>`                            
            }
            for(let i of document.getElementsByClassName("modaltitle")) {
                i.innerText=key.replace(bucket.prefix,"")                    
            }
        }
        )
        if ( big ) {
            setFullscreenModal(true)
            
        } else {
            setNormalModal(true)
        }
        
    } else if (key.endsWith(".mp4")  ) {
        
        // looks like browser cannot play original file but downloaded it plays fine
        // ffmpeg -i fred.mp4 -vf scale=1280:720 -r 8 8smaller.mp4

        signUrl(s3client, key, bucket.bucket, 900, (url) => {
            
            console.log(url)
            for(let t of document.getElementsByClassName("modalview")) {
                t.innerHTML = `
                <video class="playvideo" controls>
                    <source  type="video/mp4"   src="${url}"    ></source>
                </video>                                    
                `
                //  cannot get a good download video link <a href="${url}"  download>CLICK TO DOWNLOAD!!!!</a> 
            }


            for(let i of document.getElementsByClassName("modaltitle")) {
                i.innerText=key.replace(bucket.prefix,"")                    
            }
        }
        )
        if ( big ) {
            setFullscreenModal(true)
            
        } else {
            setNormalModal(true)
        }
        
    }  else if (key.endsWith("/")) {
        bucket.prefix = key
        changeUpdateDirectoryList()

    } else if (key.endsWith(".txt")) {
        signUrl(s3client, key, bucket.bucket, 30, (url) => {
            console.log(url)
            for(let t of document.getElementsByClassName("modalview")) {
                t.innerHTML = `<iframe src=${url}></iframe>`                            
            }
            for(let i of document.getElementsByClassName("modaltitle")) {
                i.innerText=key                    
            }
        })
        if ( big ) {
            setFullscreenModal(true)
            
        } else {
            setNormalModal(true)
        }
    } else {
        alert(what)
    }
}

export default onClickS3Object