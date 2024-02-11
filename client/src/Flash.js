
function Flash( {duration,switchedOn,children}) {

    setTimeout( () => {
        switchedOn(false)
    },duration)
    return (
        <div className="Flash">          
            {children}
        </div>
    )
}

export default Flash;