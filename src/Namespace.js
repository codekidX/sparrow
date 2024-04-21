import { Row, Button, Col, Card, Badge } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

import "./App.css";
import ToastComponent from "./ToastComponent";

import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";

import Editor from "@monaco-editor/react";

const queryInputStyle = {
  width: "100%",
  backgroundColor: "#2e2e2e",
  border: "none",
  borderRadius: "5px",
  color: "white",
  fontFamily: "monospace",
  padding: "1em",
  margin: "0.5em",
};

function Namespace() {
  const location = useLocation();
  const navigate = useNavigate();

  const [state, setState] = useState({
    sets: [],
    activeSetIndex: 0,
    messageError: "",
    messageSuccess: "",
    headerKeys: [],
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
      .catch((e) => console.error(e));
  }, []);

  const onScanClicked = () => {
    invoke('scan_set', { ns: location.state.ns, set: state.sets[state.activeSetIndex].set })
      .then((records) => {
        const allsets = state.sets;
        allsets[state.activeSetIndex].records = records;
        setState({
          ...state,
          sets: allsets,
          headerKeys: [],
          messageSuccess: `Got ${records.length} record(s)`,
        });
      })
      .catch((e) => showErrorToast(e));
  };

  const onRunClicked = () => {
    let queryObject;
    try {
      queryObject = JSON.parse(queryRef.current.getValue());
      if (Object.keys(queryObject).length == 0) {
        showErrorToast("Nothing to query!");
        return;
      }
      // if (queryObject.$pk.length === 0) {
      //     showErrorToast("primary key filter cannot be empty");
      //     return;
      // }

      // if (queryObject.$select) {
      //     if (!Array.isArray(queryObject.$select)) {
      //         showErrorToast("bins is not an array");
      //         return;
      //     }

      //     if (queryObject.$select.length === 0) {
      //         showErrorToast("bins should not be empty");
      //         return;
      //     }
      // }

      if (!queryObject.$eq) {
      }
      //   if (queryObject.$eq && Object.keys(queryObject.$eq).length == 0) {
      //     showErrorToast("$eq must contain query object");
      //     return;
      //   }

      invoke("query_set", {
        query: {
          ...queryObject,
          ns: location.state.ns,
          set: state.sets[state.activeSetIndex].set,
        },
      })
        .then((records) => {
          const allsets = state.sets;
          allsets[state.activeSetIndex].records = records;
          setState({
            ...state,
            sets: allsets,
            headerKeys: records.length > 0 ? Object.keys(records[0]) : [],
            messageSuccess: `Got ${records.length} record(s)`,
          });
        })
        .catch((e) => showErrorToast(e));
    } catch (e) {
      console.error("Error while parsing json -> ", e);
    }
  };

  const resetMessage = () => {
    setState({ ...state, messageSuccess: "", messageError: "" });
  };

  const showSuccessToast = (message) => {
    setState({ ...state, messageSuccess: message });
  };

  const showErrorToast = (message) => {
    setState({ ...state, messageError: message });
  };

  const getHumanReadableSize = (size) => {
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (
      +(size / Math.pow(1024, i)).toFixed(2) * 1 +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i]
    );
  };

  return (
    <div className="App">
      <Button
        style={{
          fontSize: "12px",
          background: "linear-gradient(to right, #9d50bb, #6e48aa)",
          border: "none",
        }}
        onClick={() => {
          navigate(-1);
        }}
      >
        Go back
      </Button>
      {/* <a target="_blank" href="https://github.com/codekidX/sparrow#sparrow-query">
                <Button variant="outline-light" style={{ marginLeft: '1em', fontSize: '13px', borderColor: '#2d2d2d' }}>📚 Sparrow Query Docs</Button>
            </a> */}
      <span style={{ marginLeft: "1em", marginRight: "1em" }}>
        {location.state.ns}
      </span>{" "}
      →<span style={{ marginLeft: "1em" }}>{location.state.host}</span>
      <br />
      <br />
      <Row style={{ height: "90vh" }}>
        <Col xs={4} md={3}>
          <div
            style={{
              backgroundColor: "transparent",
              height: "90vh",
              borderRadius: "5px",
              border: "0.01px solid #2d2d2d",
              overflow: 'scroll'
            }}
          >
            {state.sets.map((set, index) => {
              if (index === state.activeSetIndex) {
                return (
                  <div
                    style={{
                      borderRadius: "5px",
                      background: "linear-gradient(to right, #9d50bb, #6e48aa)",
                      color: "white",
                      padding: "1.2em",
                    }}
                  >
                    {set.set}
                  </div>
                );
              } else {
                return (
                  <div
                    onClick={() => {
                      setState({ ...state, activeSetIndex: index });
                    }}
                    style={{
                      borderRadius: "5px",
                      color: "white",
                      padding: "1em",
                      cursor: "pointer",
                    }}
                  >
                    {set.set}
                  </div>
                );
              }
            })}
          </div>
        </Col>

        {/* RIGHT SECTION */}
        <Col xs={14} md={9}>
          <div className="sticky-query-section" >
          <h3>{state.sets[state.activeSetIndex]?.set}</h3>
          <br />
          <div style={{ display: "flex" }}>
            <Editor
              onMount={handleEditorDidMount}
              options={{ minimap: { enabled: false } }}
              theme="vs-dark"
              height="8em"
              defaultLanguage="json"
              defaultValue={`{
    "$eq": {
              
    }
}`}
            />
          </div>
          <div className="d-flex">
          <Button
              onClick={onRunClicked}
              variant="outline-light"
              style={{
                margin: "0.5em",
                borderColor: "#2d2d2d",
                fontSize: "12px",
              }}
            >
              Run
            </Button>
            <Button
              onClick={onScanClicked}
              variant="outline-light"
              style={{
                margin: "0.5em",
                borderColor: "#2d2d2d",
                fontSize: "12px",
              }}
            >
              Scan
            </Button>
          </div>
          <br />
          {state.sets.length > 0 ? (
            <h6>
              <Badge className="meta-badge">
                count: {state.sets[state.activeSetIndex].objects}
              </Badge>
              <Badge style={{ marginLeft: "1em" }} className="meta-badge">
                size:{" "}
                {getHumanReadableSize(
                  state.sets[state.activeSetIndex].size_bytes
                )}
              </Badge>
            </h6>
          ) : (
            <div></div>
          )}
          <br />
          </div>
          

          {/* 
                    <td style={{ width: '40%' }}>{th}</td>
                                            <td style={{ width: '60%' }}>{r[th]}</td> */}

          {state.sets[state.activeSetIndex]?.records?.map((r) => (
            <Card
              style={{
                borderRadius: "5px",
                marginTop: "0.7em",
                backgroundColor: "#242526",
              }}
            >
              {/* <Card.Header>
                            <Row>
                                <Col>
                                <b>Key</b>
                                </Col>
                                <Col>
                                <b>Value</b>
                                </Col>
                            </Row>
                        </Card.Header> */}
              <Card.Body>
                <pre style={{ fontSize: '14px' }}>{JSON.stringify(r, null, 4)}</pre>
              </Card.Body>
            </Card>
          ))}

          {/* {state.records.map(r => (
                        <Card style={{ margin: '2em', backgroundColor: '#242526', border: 'none', fontFamily: 'monospace' }}>
                        <Card.Body>{JSON.stringify(r, null, 2)}</Card.Body>
                        </Card>
                    ))} */}
        </Col>
      </Row>
      <ToastComponent
        messageError={state.messageError}
        messageSuccess={state.messageSuccess}
        resetMessage={resetMessage}
      />
    </div>
  );
}

export default Namespace;
