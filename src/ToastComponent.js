import { Toast, ToastContainer } from "react-bootstrap";

function ToastComponent(props) {
    const innerState = {
        showError: props.messageError === '' ? false : true,
        showSuccess: props.messageSuccess === '' ? false : true,
    };
    
    return (
        <ToastContainer position="bottom-end" className="p-3">
            <Toast show={innerState.showError} onClose={props.resetMessage} bg="danger" delay={3000} autohide>
                <Toast.Body>{props.messageError}</Toast.Body>
            </Toast>
            <Toast show={innerState.showSuccess} onClose={props.resetMessage} bg="success" delay={3000} autohide>
                <Toast.Body>{props.messageSuccess}</Toast.Body>
            </Toast>
        </ToastContainer>
    )
}

export default ToastComponent;