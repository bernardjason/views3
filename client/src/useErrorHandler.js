import { NotAuthorizedException} from "@aws-sdk/client-cognito-identity";
import { logoutFromCognito } from "./Login";


function useErrorHandler(error,msg) {

    if ( error instanceof NotAuthorizedException || error.name === "AccessDenied" || error.name === "NotAuthorizedException" ) {
        console.log(`Not authorized ${JSON.stringify(error)}`);
        alert(`${msg}\n\nNo longer logged in`);
        logoutFromCognito()
        
    } else{        
        console.log(+JSON.stringify(error));
        alert(`Unexpected error ${error}`)
        
    }
}

export default useErrorHandler