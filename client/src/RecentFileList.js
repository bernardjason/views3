import './App.css';
import React, { useState,  useContext ,useEffect, useCallback} from "react";
import { fileListContext } from './App.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import {Row,Col} from 'react-bootstrap';



import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Image from 'react-bootstrap/Image';
import {  signUrl } from './S3AllObjects.js';
import { BiFullscreen, BiFolder , BiDownArrow , BiUpArrow , BiFileBlank} from 'react-icons/bi';

function RecentFileList() {

    const {  s3client, bucket, goUpToParent, fileList , changeUpdateDirectoryList , recentFileList} = useContext(fileListContext);

    const [normalModal, setNormalModal] = useState(false);
    const [fullscreenModal, setFullscreenModal] = useState(false);
    const [icons,setIcons] = useState( new Map() );
    const [sorted , setSorted] = useState();
  
    function onClickS3Object(what, destination, key,big) {
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

    function xxepochToString(e) {
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        var date = new Date(parseInt(e));
        function pad(n) {
            return String(n).padStart(2,'0')
        }
        
        return `${days[date.getUTCDay()]},${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`
    }

    function epochToString(e) {
        var date = new Date(parseInt(e));
        
        return date.toUTCString()
    }

    useEffect( () => {
        const refreshSortIt = (a,b) =>  {           
            return parseFloat(b.lastModified) -  parseFloat(a.lastModified)            
        }

        const sortData = recentFileList.toSorted( refreshSortIt)
        setSorted(sortData )   

    }, [ recentFileList , bucket.prefix] )


    useEffect( () => {
        const theIcons = new Map();
        const promisesArray = []
        for(let o of recentFileList) {
            if ( o.key.endsWith("-icon.jpg")) {
                promisesArray.push(signUrl(s3client, o.key, bucket.bucket, 30, (url) => {
                            theIcons.set(o.key.replace("-icon.jpg","-scaled.mp4"),url)
                            theIcons.set(o.key.replace("-icon.jpg",".mp4"),url)
                            theIcons.set(o.key.replace("-icon.jpg",".jpg"),url)                            
                        }
                    )
                )
            }
        }
        Promise.all(promisesArray)
        .then(() => {
            setIcons(theIcons)
        })
        .catch(e => console.error(e));
    }, [bucket.bucket, recentFileList, s3client] )

    

  
    // https://stackoverflow.com/questions/39435395/reactjs-how-to-determine-if-the-application-is-being-viewed-on-mobile-or-deskto
    const [width, setWidth] = useState(window.innerWidth);

    function handleWindowSizeChange() {
        setWidth(window.innerWidth);
    }
    function splitIntoDirectoryAndFile(fullname) {
        const elements = fullname.split("/")
        const filename = elements.pop()
        const path=elements[0];//.join("/")
        return {path,filename}
    }
    function getPath(fullname) {
        return splitIntoDirectoryAndFile(fullname).path
    }
    function getFilename(fullname) {
        return splitIntoDirectoryAndFile(fullname).filename
    }
    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    const isMobile = width <= 768;
    const colClass = isMobile ?  "" : "desktop-row" ;

    return (
        
        <div  >
            <div>
     

                <Container fluid>                                     
                    {
                        sorted && sorted.filter((objectItem) => ! objectItem.key.endsWith("-icon.jpg")).map((objectItem) =>
                            <Row   key={objectItem.id + objectItem.key} >
                                
                                
                                <Col className={colClass} lg={10}>
                                    { (! isMobile &&   ! objectItem.key.endsWith("/")) && 
                                        <Button size="lg" variant="link" onClick={() => onClickS3Object(objectItem.content, "image" + objectItem.key, objectItem.key,true)}>
                                            <BiFullscreen size={"40"}></BiFullscreen>                                        
                                            </Button>
                                    }   
                                    
                                    
                                    {
                                        icons.get(objectItem.key)  && <Image 
                                            onClick={() => onClickS3Object(objectItem.content, "image" + objectItem.key, objectItem.key,false)}
                                            src={icons.get(objectItem.key)} width={"100px"}thumbnail />
                                    }
                            
                                 
                                    {  isMobile && getPath(objectItem.key.replace(bucket.prefix,""))}                                                                                                          
                                    
                                    <Button variant="link" 
                                        onClick={() => onClickS3Object(objectItem.content, "image" + objectItem.key, objectItem.key,false)}                                         
                                        >                                                                               
                                        { getFilename(objectItem.key.replace(bucket.prefix,""))}
                                        
                                    </Button>                                    
                                    
                                </Col>
                                { isMobile &&
                                    <Col lg={2}>
                                    {  ! objectItem.key.endsWith("/") && epochToString(objectItem.lastModified)  }
                                    
                                    </Col>
                                }
                                {  ! isMobile  &&
                                    <Col lg={5}>
                                        { getPath(objectItem.key.replace(bucket.prefix,""))+"" }
                                        &nbsp;&nbsp;&nbsp;                                    
                                        {  epochToString(objectItem.lastModified)  }                                                                        
                                    </Col>
                                }
                               
                            </Row>
                            
                        )
                    }
              
                </Container>


                </div>


                <Modal dialogClassName="small-modal" id="modaldialog"  fullscreen={false} show={normalModal} centered={true} onHide={() => setNormalModal(false)}>
                    <Modal.Header closeButton>
                    <Modal.Title className="modaltitle">Modal</Modal.Title>
                    </Modal.Header>
                    <Modal.Body><div className="modalview 	.modal-sm"></div></Modal.Body>
                </Modal>

                <Modal dialogClassName="large-modal" show={fullscreenModal} centered={true} 
                    fullscreen={false}
                    onHide={() => setFullscreenModal(false)}>
                    <Modal.Header closeButton>
                    <Modal.Title><div className="modaltitle"></div></Modal.Title>
                    </Modal.Header>
                    <Modal.Body><div className="modalview"></div></Modal.Body>

                </Modal>
  


        </div>

        
    );

 
}

export default RecentFileList;
