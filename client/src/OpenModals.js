import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal';


function OpenModals( {normalModal , setNormalModal , fullscreenModal , setFullscreenModal} ) {

    
    return (
        <div>
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
    )
}

export default OpenModals