import './App.css';
import React, { useState,  useContext ,useEffect, } from "react";
import { fileListContext } from './App.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import {Row,Col} from 'react-bootstrap';
import OpenModals from './OpenModals.js';
import onClickS3Object from './openS3Object.js';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import {  signUrl } from './S3AllObjects.js';
import { BiFullscreen, } from 'react-icons/bi';

function RecentFileList() {

    const {  s3client, bucket, goUpToParent, fileList , changeUpdateDirectoryList , recentFileList} = useContext(fileListContext);

    const [normalModal, setNormalModal] = useState(false);
    const [fullscreenModal, setFullscreenModal] = useState(false);
    const [icons,setIcons] = useState( new Map() );
    const [sorted , setSorted] = useState();
  
  
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
        const path=elements[1];//.join("/")
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
                                
                                
                                <Col className={colClass} style={{display:'flex', textOverflow:'ellipsis' , overflow:'hidden' }} lg={10}>
                                    { (! isMobile &&   ! objectItem.key.endsWith("/")) && 
                                        <Button size="lg" variant="link" onClick={() => onClickS3Object(objectItem.content,  objectItem.key,true,
                                                s3client , bucket, setFullscreenModal , setNormalModal , changeUpdateDirectoryList)}>
                                            <BiFullscreen size={"40"}></BiFullscreen>                               
                                            </Button>
                                    }   
                                    
                                    
                                    {
                                        icons.get(objectItem.key)  && <Image 
                                            onClick={() => onClickS3Object(objectItem.content, objectItem.key,false,
                                                s3client , bucket, setFullscreenModal , setNormalModal , changeUpdateDirectoryList)}
                                            src={icons.get(objectItem.key)} width={"100px"}thumbnail />
                                    }
                            
                                 
                                                                                                                                            
                                    
                                    <Button variant="link" 
                                        onClick={() => onClickS3Object(objectItem.content, objectItem.key,false,
                                            s3client , bucket, setFullscreenModal , setNormalModal , changeUpdateDirectoryList)}                                         
                                        >       
                                                                                                                
                                        { getFilename(objectItem.key.replace(bucket.prefix,""))}
                                        
                                    </Button>                                    
                                    
                                </Col>
                                { isMobile &&
                                    <Col >
                                        {  isMobile && getPath(objectItem.title)}&nbsp;&nbsp;&nbsp;            
                                    {  ! objectItem.key.endsWith("/") && epochToString(objectItem.lastModified)  }                                       
                                    </Col>
                                }
                                {  ! isMobile  &&
                                    <Col lg={5}>
                                        { getPath(objectItem.title)+"" }
                                        &nbsp;&nbsp;&nbsp;                                    
                                        {  epochToString(objectItem.lastModified)  }                                                                        
                                    </Col>
                                }
                               
                            </Row>
                            
                        )
                    }
              
                </Container>


                </div>


                <OpenModals normalModal={normalModal} setNormalModal ={setNormalModal} fullscreenModal={fullscreenModal} 
                                setFullscreenModal={setFullscreenModal} ></OpenModals>
  


        </div>

        
    );

 
}

export default RecentFileList;
