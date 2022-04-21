import { Link, useLocation, useNavigate } from "react-router-dom";

import "./App.css";

import { invoke } from "@tauri-apps/api/tauri"
import { Button, Card, Table } from "react-bootstrap";
import { useEffect, useState } from "react";

function Schema() {
    const [state, setState] = useState({
        nodes: [],
    });

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
            invoke("get_node_info")
            .then(nodes => setState({ nodes }))
            .catch(e => console.error(e));
    }, []);

    return (
        <div className="App">
            <div className="boxed">{location.state.host}</div>
            {
                state.nodes.length === 0 ? '' : 
                (state.nodes.map(n => (
                    <div>
                        <b>Node: {n.name}</b>
                        <br/><br/>

                        <div style={{ display: 'flex' }} >
                            {n.namespaces.map(ns => (
                                    <Card style={{ margin: '2em', backgroundColor: '#242526', border: 'none', cursor: 'pointer' }} onClick={() => {
                                        navigate(`/ns/${ns}`, { state: { ns, node: n.name, host: location.state.host } })
                                    }}>
                                    <Card.Body>{ns}</Card.Body>
                                    </Card>
                                ))}
                        </div>

                    </div>
                )))
            }     

            <Button style={{ fontSize: '13px' }} variant="danger" onClick={() => {
                invoke("disconnect")
                    .then((a) => {
                        setState({ ...state, messageSuccess: 'Disconnected' });
                        navigate(-1);
                    })
                    .catch(e => console.error(e))
            }}>Disconnect</Button>

        </div>
    )
}

export default Schema;