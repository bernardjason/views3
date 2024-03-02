import './App.css';
import React, { useState,  useContext ,useEffect, useCallback} from "react";
import { fileListContext } from './App.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import {Row,Col} from 'react-bootstrap';


import onClickS3Object from './openS3Object.js';

import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import {  signUrl } from './S3AllObjects.js';
import { BiFullscreen, BiFolder , BiDownArrow , BiUpArrow , BiFileBlank} from 'react-icons/bi';
import OpenModals from './OpenModals.js';

function FileList() {

    const {  s3client, bucket, goUpToParent, fileList , changeUpdateDirectoryList } = useContext(fileListContext);

    const [normalModal, setNormalModal] = useState(false);
    const [fullscreenModal, setFullscreenModal] = useState(false);
    const [sorted , setSorted] = useState();
    const [icons,setIcons] = useState( new Map() );
    const [sortFlip , setSortFlip] = useState(true)
    
  
    function epochToString(e) {
        var date = new Date(parseInt(e));
        
        return date.toUTCString()
    }



    useEffect( () => {
        const refreshSortIt = (a,b) =>  {
            if (b.lastModified === undefined  ) {
                // without converting to a number Chrome wasnt happy.
                let response = stringToNumber(a.key) - stringToNumber(b.key)
                response = response * -1
                return response 
            }
            
            return parseFloat(b.lastModified) -  parseFloat(a.lastModified)
            
        }

        const sortData = fileList.toSorted( refreshSortIt)
        setSorted(sortData )   

    }, [ fileList , bucket.prefix] )


    function stringToNumber(s) {
        if ( s == null ) {
            return 0
        }
        let numbers = s.match( /\d+/g )               
        let characters = []
        if ( numbers == null ) {
            return 0
        }
        for(let w of numbers) {            
            for(let c of w.split("")  ) {     
                characters.push(c)
            }
        }
        let total = 0
        let i=characters.length
        for( let c of characters) {                      
                total = total + Math.pow(10,i)*(c)
                i--
        }                
        return total
    }


    

    const onSortClick = useCallback( () => {
        const sortIt = (a,b) =>  {
            if (b.lastModified === undefined  ) {
                // without converting to a number Chrome wasnt happy.
                let response = stringToNumber(a.key) - stringToNumber(b.key)
                if ( sortFlip) {
                    response = response * -1
                }
                return response 
            }
            if ( sortFlip) {
                return parseFloat(a.lastModified) -  parseFloat(b.lastModified)
            }
            return parseFloat(b.lastModified) -  parseFloat(a.lastModified)
        }

        setSortFlip( ! sortFlip )
        const sortData = fileList.toSorted( sortIt)

        console.log(`${JSON.stringify(sortData)}`)

        setSorted(sortData )   
        
         
    },[fileList, sortFlip ])

     useEffect( () => {
        const theIcons = new Map();
        const promisesArray = []
        for(let o of fileList) {
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
    }, [bucket.bucket, fileList, s3client] )

    // https://stackoverflow.com/questions/39435395/reactjs-how-to-determine-if-the-application-is-being-viewed-on-mobile-or-deskto
    const [width, setWidth] = useState(window.innerWidth);

    function handleWindowSizeChange() {
        setWidth(window.innerWidth);
    }
    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    const isMobile = width <= 768;
    
    return (
        
        <div  >
            <div>
           
           
            </div>
            <div>
     

                <Container fluid>
                
                    <Row   >

                        <Col  style={{display:'flex', justifyContent:'right' , }} ><Button variant="link" onClick={onSortClick}>timestamp 
                        { sortFlip && <BiUpArrow></BiUpArrow> } 
                        { ! sortFlip && <BiDownArrow></BiDownArrow> } 
                        </Button>
                        </Col>
                    </Row>

                    {
                    bucket.previous !== bucket.prefix && <Row  key={bucket.previous}>
                        { isMobile && 
                        <Col style={{display:'flex', justifyContent:'left'}}  >
                            <Button variant="link" onClick={goUpToParent}><b>Parent {bucket.previous}</b></Button>
                        </Col>
                        }
                        { ! isMobile && 
                        <Col >
                            <Button variant="link" onClick={goUpToParent}><b>Parent {bucket.previous}</b></Button>
                        </Col>
                        }
                    </Row>
                    }
                    
                    {
                        sorted && sorted.filter((objectItem) => ! objectItem.key.endsWith("-icon.jpg")).map((objectItem) =>
                           
                            <Row   key={objectItem.id + objectItem.key} >
                                
                                <Col style={{display:'flex', textOverflow:'ellipsis' , overflow:'hidden' }} >
                                    { (! isMobile &&   ! objectItem.key.endsWith("/")) && 
                                        <Button size="lg" variant="link" onClick={() => onClickS3Object(objectItem.content, objectItem.key,true,
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
                                    {
                                        (! icons.get(objectItem.key) &&  ! objectItem.key.endsWith("/") ) 
                                             &&  <div  style={{paddingLeft:"0px", justifyContent:'right'}} > <BiFileBlank  size={"50px"} color="blue" /> </div>
                                    }
                                    

                                    <Button variant="link" 
                                        onClick={() => onClickS3Object(objectItem.content, objectItem.key,false,
                                            s3client , bucket, setFullscreenModal , setNormalModal , changeUpdateDirectoryList)}
                                         
                                        >
                                        { objectItem.key.endsWith("/") && <div><BiFolder></BiFolder> {objectItem.key}</div> }
                                        { ! objectItem.key.endsWith("/") && objectItem.key.replace(bucket.prefix,"")}
                                    </Button>                                    
                                    
                                </Col>
                                { isMobile &&
                                    <Col lg={5}>
                                    {  ! objectItem.key.endsWith("/") && epochToString(objectItem.lastModified)  }
                                    
                                    </Col>
                                }
                                { ( ! isMobile && ! objectItem.key.endsWith("/") ) &&
                                    <Col lg={5}>
                                    {  ! objectItem.key.endsWith("/") && epochToString(objectItem.lastModified)  }
                                    
                                    </Col>
                                }
                               
                            </Row>
                            
                        )
                    }
              
                </Container>

                    <OpenModals normalModal={normalModal} setNormalModal ={setNormalModal} fullscreenModal={fullscreenModal} 
                                setFullscreenModal={setFullscreenModal} ></OpenModals>

                </div>



  


        </div>

        
    );

 
}

export {FileList};
