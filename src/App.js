import './App.css';
import './ToastComponent';

import { invoke } from '@tauri-apps/api/tauri'
import { Form, Button, Card, Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ToastComponent from './ToastComponent';

const inputStyle = {
  backgroundColor: '#242526',
  color: 'white',
  border: "none",
  fontSize: '13px'
}

function App() {
  const [state, setState] = useState({
    messageError: '',
    messageSuccess: '',
  });

  const resetMessage = () => {
    setState({
      messageError: '',
      messageSuccess: '',
    });
  }

  const navigate = useNavigate();

  let conns = localStorage.getItem("conns");
  conns = conns === "" || conns === null ? [] : JSON.parse(conns);

  return (
    <div className="App">
      <b>New Connection</b>
      <br />
      <br />
      <Form onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          nickname: e.target[0].value,
          hosts: e.target[1].value,
          username: e.target[2].value === '' ? null : e.target[2].value,
          password: e.target[3].value === '' ? null : e.target[3].value,
          port: Number(e.target[4].value),
        };

        const hasSameNickname = !!conns.find(c => c.nickname === payload.nickname);
        if (hasSameNickname) {
          setState({
            ...state,
            messageError: `Connection with nickname: "${payload.nickname}" already exists. Please change the nickname.`
          });
          return;
        }

        invoke("connect", { payload })
          .then(response => {
            if (!response.ok) {
              setState({
                ...state,
                messageError: response.message
              });
              return;
            }

            let connections = localStorage.getItem("conns");
            if (connections === "" || connections === null) {
              localStorage.setItem("conns", JSON.stringify([payload]));
            } else {
              connections = JSON.parse(connections);
              connections.push(payload);
              localStorage.setItem("conns", JSON.stringify(connections));
            }

            navigate("/schema", { state: { host: payload.hosts, nickname: payload.nickname }, replace: true });
          });
      }}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Control required style={inputStyle} placeholder="Nickname" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Control required style={inputStyle} placeholder="Enter hosts (comma separated)" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Control style={inputStyle} placeholder="Enter username" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Control style={inputStyle} type="password" placeholder="Enter password" />
        </Form.Group>


        <Form.Group className="mb-3">
          <Form.Control required style={inputStyle} max={99999} type="number" placeholder="Enter port" />
        </Form.Group>

        <Button style={{ fontSize: '13px', borderColor: '#2d2d2d' }} variant="outline-light" type="submit">
          Submit
        </Button>
      </Form>

      <br />
      <div style={{ width: '100%', height: '1px', backgroundColor: '#2d2d2d' }} ></div>
      <br />
      {conns.length > 0 ? (
        <div>
          <b>Saved Connections</b>
          <br />
          <br />

          <Row>
            {conns.map(conn =>
            (
              <Col xs={6} md={4}>
                <Card style={{ backgroundColor: '#242526', fontSize: '13px', borderRadius: '5px' }} >
                  <div style={{ padding: '1em' }}>
                  <b>{conn.nickname}</b>
                  </div>
                  <Card.Body style={{ display: 'flex', flexDirection: 'row-reverse', backgroundColor: '#242526' }}>
                    <Button style={{ fontSize: '13px', background: 'linear-gradient(to right, #9d50bb, #6e48aa)', border: 'none' }} onClick={() => {
                      invoke("connect", { payload: conn })
                        .then(response => {
                          if (!response.ok) {
                            setState({
                              ...state,
                              messageError: response.message
                            });
                            return;
                          }

                          navigate("/schema", { state: { host: conn.hosts, nickname: conn.nickname }, replace: true });
                        });
                    }}>Connect</Button>
                  </Card.Body>
                </Card>
              </Col>
            )
            )}
          </Row>
        </div>
      ) : ''}

      <ToastComponent messageError={state.messageError} messageSuccess={state.messageSuccess} resetMessage={resetMessage} />
    </div>
  );
}

export default App;
