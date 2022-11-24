import { Row, Button, Col, Card, Table } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

import "./App.css";
import ToastComponent from "./ToastComponent";

import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";

import Editor from "@monaco-editor/react";


const queryInputStyle = {
    width: '100%',
    backgroundColor: '#2e2e2e',
    border: 'none',
    borderRadius: '5px',
    color: "white",
    fontFamily: "monospace",
    padding: '1em',
    margin: '0.5em'
};

function Namespace() {
    const location = useLocation();
    const navigate = useNavigate();

    const [state, setState] = useState({
        sets: [],
        activeSetIndex: 0,
        records: [],
        messageError: '',
        messageSuccess: '',
        headerKeys: []
    });

    let queryRef = useRef();


    function handleEditorDidMount(editor, monaco) {
        queryRef.current = editor;
    }

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

    const onRunClicked = () => {
        let queryObject;
        try {
            queryObject = JSON.parse(queryRef.current.getValue());
            if (!queryObject.$pk) {
                showErrorToast("primary key not specified");
                return;
            }

            if (!Array.isArray(queryObject.$pk)) {
                showErrorToast("primary key filter is not an array");
                return;
            }

            if (queryObject.$pk.length === 0) {
                showErrorToast("primary key filter cannot be empty");
                return;
            }

            if (queryObject.$select) {
                if (!Array.isArray(queryObject.$select)) {
                    showErrorToast("bins is not an array");
                    return;
                }

                if (queryObject.$select.length === 0) {
                    showErrorToast("bins should not be empty");
                    return;
                }
            }

            invoke("query_set", { query: { ...queryObject, ns: location.state.ns, set: state.sets[state.activeSetIndex] } })
                .then(records => {
                    setState({ ...state, records, headerKeys: records.length > 0 ? Object.keys(records[0]) : [], messageSuccess: `Got ${records.length} record(s)` });
                })
                .catch(e => console.error(e));
        } catch (e) {
            console.error("Error while parsing json -> ", e);
        }
    }


    const resetMessage = () => {
        setState({ ...state, messageSuccess: '', messageError: '' });
    }

    const showSuccessToast = (message) => {
        setState({ ...state, messageSuccess: message });
    }

    const showErrorToast = (message) => {
        setState({ ...state, messageError: message });
    }

    return (
        <div className="App" style={{ fontSize: '13px' }}>
            <Button style={{ fontSize: '13px' }} onClick={() => {
                navigate(-1);
            }}  >Go back</Button>

            <a target="_blank" href="https://github.com/codekidX/sparrow#sparrow-query">
                <Button variant="outline-light" style={{ marginLeft: '1em', fontSize: '13px' }}>📚 Sparrow Query Docs</Button>
            </a>

            <span style={{ marginLeft: '1em', marginRight: '1em' }}>{location.state.ns} </span> |
            <span style={{ marginLeft: '1em' }}>{location.state.host}</span>

            <br />
            <br />
            <Row style={{ height: '100%' }}>
                <Col xs={4} md={3}>
                    <div style={{ backgroundColor: '#242526', height: '100%', borderRadius: '5px' }}>
                        {state.sets.map((set, index) => {
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
                        <Editor
                            onMount={handleEditorDidMount}
                            options={{ minimap: { enabled: false } }}
                            theme="vs-dark"
                            height="5em"
                            defaultLanguage="json"
                            defaultValue={`{"$pk": []}`}
                        />
                        <Button onClick={onRunClicked} variant="outline-light" style={{ margin: '0.5em' }} >Run</Button>
                    </div>

                    <br />
                    <br />


                    <Table className="table-curved" id="records-table" variant="dark">
                        {/* <thead>
                            <tr>
                                {state.headerKeys.map(th => <th>{th}</th>)}
                            </tr>
                        </thead> */}
                        <tbody>
                        
                            {state.records.map(r => (
                                <div>
                        <th style={{ width: '40%' }}>
                                        Key
                                    </th>
                                    <th style={{ width: '60%' }}>
                                       Value
                                    </th>            
                                    {state.headerKeys.map(th => (
                                            <tr>
                                            <td style={{ width: '40%' }}>{th}</td>
                                            <td style={{ width: '60%' }}>{r[th]}</td>
                                            </tr>
                                    ))}
                                </div>
                            ))}
                        </tbody>
                    </Table>

                    {/* {state.records.map(r => (
                        <Card style={{ margin: '2em', backgroundColor: '#242526', border: 'none', fontFamily: 'monospace' }}>
                        <Card.Body>{JSON.stringify(r, null, 2)}</Card.Body>
                        </Card>
                    ))} */}

                </Col>
            </Row>

            <ToastComponent messageError={state.messageError} messageSuccess={state.messageSuccess} resetMessage={resetMessage} />
        </div>
    )
}

export default Namespace;