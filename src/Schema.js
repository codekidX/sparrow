import { useLocation, useNavigate } from "react-router-dom";

import "./App.css";

import { invoke } from "@tauri-apps/api/tauri"
import { Button, Card, ListGroup, ListGroupItem } from "react-bootstrap";
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
            <div className="boxed">{location.state.nickname} → {location.state.host}</div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'row-reverse', padding: '1em' }} >
                <Button style={{ fontSize: '13px' }} variant="danger" onClick={() => {
                    invoke("disconnect")
                        .then((a) => {
                            setState({ ...state, messageSuccess: 'Disconnected' });
                            navigate('/', { replace: true });
                        })
                        .catch(e => console.error(e))
                }}>Disconnect</Button>

            </div>
            <div>
            {
                state.nodes.length === 0 ? '' :
                (state.nodes.map(n => (
                    <Card style={{ backgroundColor: '#141414', color: 'white', margin: '0.5em', borderRadius: '5px' }}>
                        <Card.Header>
                        <b style={{ fontFamily: 'monospace' }} >Node: {n.name}</b>
                        </Card.Header>
                        <Card.Body>
                        <ListGroup style={{ borderRadius: '10px', margin: '1em' }}>
                                {n.namespaces.map((ns, index) => (
                                    <ListGroupItem style={{ color: 'white', backgroundColor: '#242526', border: 'none', cursor: 'pointer' }} onClick={() => {
                                        navigate(`/ns/${ns}`, { state: { ns, node: n.name, host: location.state.host } })
                                    }}>
                                        ↳ {ns}
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                    )))
            }
            </div>
            

        </div>
    )
}

export default Schema;