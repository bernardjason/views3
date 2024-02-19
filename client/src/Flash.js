
function Flash( {duration,switchedOn,flash }) {

    /*
    setTimeout( () => {
        switchedOn( { state:false } )
    },duration)
    */
    return (
        <div className="Flash">          
            {flash.message}
        </div>
    )
}

export default Flash;