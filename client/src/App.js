import './App.css';
import React, {  useState  } from "react";
import {FileList,} from './FileList.js'
import RecentFileList from './RecentFileList.js';
import {Login, authenticateWithCognito, logoutFromCognito}  from './Login.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';

import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import useFileLogic from './useFileLogic.js';
import {  BiRefresh} from 'react-icons/bi';
import Flash from './Flash.js';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

const fileListContext = React.createContext();


function App() {
  
  const [tokens,setTokens] = useState( { isLoggedIn:false} )
  const [s3client,setS3Client] = useState( null)

  const [bucketList,setBucketList] = useState([])
  const [bucket, setBucket] = useState( { bucket:"" , prefix:"/", previous:"/"})
  const [flash,setFlash] = useState( {state:false, message:""} )
 
  Login(setTokens,setS3Client,setBucketList,setBucket);

  const [goUpToParent, changeUpdateDirectoryList , refreshFiles , fileList , recentFileList] = useFileLogic(s3client ,bucketList[0],bucket,setFlash)

  function logout() {
    setTokens( { isLoggedIn:false} )
    logoutFromCognito()
  }

  function refreshPressed() {
    setFlash({state:true,message:"refreshing..."})
    refreshFiles()
  }


  return (

    <fileListContext.Provider value={ { s3client, bucket, goUpToParent, fileList , changeUpdateDirectoryList , refreshFiles , recentFileList} }>
       
        <Navbar bg="primary" data-bs-theme="dark">
          
          <Container>
            
            <Navbar.Brand>ViewS3</Navbar.Brand>
            <Nav className="me-auto">      
            <Nav.Link onClick={refreshPressed}> { bucket.prefix } <BiRefresh size={30} ></BiRefresh> refresh</Nav.Link>
            

            </Nav>
            <Nav className="me-right" >      
            {  tokens.isLoggedIn && <Nav.Link onClick={logout}>logout {tokens.userName}</Nav.Link>  }       
            {! tokens.isLoggedIn && <Nav.Link onClick={authenticateWithCognito}>login</Nav.Link>  } 
            </Nav>
          </Container>
        </Navbar>
        { flash && <Flash duration={2000} switchedOn={setFlash} flash={flash}></Flash>}
   

        
        <Tabs fill defaultActiveKey="latest">
          <Tab eventKey="latest" title="Latest" >
          <div itemID="recentFiles" className="App" >
              
              { ! tokens.isLoggedIn && <header className="App-header"> Please log in</header>}                                           
              { tokens.isLoggedIn && <RecentFileList ></RecentFileList> }    
            </div>  
          </Tab>
          <Tab eventKey="fileView" title="File View" >
          <div itemID="fileView" className="App" >
              
              { ! tokens.isLoggedIn && <header className="App-header"> Please log in</header>}                                           
              { tokens.isLoggedIn && <FileList ></FileList> }    
            </div>  
          </Tab>
        </Tabs>
            
  

    </fileListContext.Provider>
  );
}

export {fileListContext}
export default App;
