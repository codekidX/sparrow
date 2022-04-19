import { Row, Button, Col, ListGroup } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import "./App.css";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

function Namespace() {
    const location = useLocation();
    const navigate = useNavigate();
    console.log('location: ', location);

    const [state, setState] = useState({
        sets: [],
        activeSetIndex: 0,
        bins: []
    });

    useEffect(() => {
            invoke("get_sets", { payload: location.state })
            .then((sets) => {
                setState({ ...state, sets });
                // return invoke("get_bin_list", { payload: { ...location.state, set: sets[state.activeSetIndex] } });
            })
            // .then(bins => {
            //     setState({ ...state, bins });
            // })
            .catch(e => console.error(e));
    }, [])
    
    return (
        <div className="App" style={{ fontSize: '13px' }}>
            <Button style={{ fontSize: '13px' }} onClick={() => {
                navigate(-1);
            }}  >Go back</Button>

            <Button variant="outline-light" style={{ marginLeft: '1em', fontSize: '13px' }}>📚 <b>Sparrow Query Docs</b></Button>
            
            <span style={{ marginLeft: '1em' }}>{location.state.host}</span>
            
            <br />
            <br />
            <Row style={{ height: '100%'}}>
            <Col xs={4} md={3}>
                <div style={{ backgroundColor: '#242526', height: '100%', borderRadius: '5px' }}>
                    { state.sets.map((set, index) => {
                        if (index === state.activeSetIndex) {
                            return (<div style={{ borderRadius: '5px', backgroundColor: 'blue', color: 'white', padding: '1.5em' }} >
                                {set}
                            </div>)
                        } else {
                            return (<div onClick={() => {
                                setState({ ...state, activeSetIndex: index });
                            }} style={{ borderRadius: '5px', color: 'white', padding: '1.5em', cursor: 'pointer' }} >
                                {set}
                            </div>)
                        }
                    })
                    }
                </div>
            </Col>
            <Col xs={14} md={9}>
            <div style={{ display: 'flex' }} >
            <input multiple placeholder="Sparrow Query" autoCorrect="off" style={{ width: '100%', backgroundColor: '#2e2e2e', border: 'none', borderRadius: '5px', color: "white", fontFamily: "monospace", padding: '1em', margin: '0.5em' }}>
            </input>
            <Button variant="outline-light" style={{margin: '0.5em' }} >Run</Button>
            </div>
            </Col>
            </Row>
        </div>
    )
}

export default Namespace;