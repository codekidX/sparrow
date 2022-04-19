import './App.css';

import { invoke } from '@tauri-apps/api/tauri'
import { Form, Button, Card, Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const inputStyle = {
  backgroundColor: '#242526',
  color: 'white',
  border: "none",
  fontSize: '13px'
}

function App() {
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
          hosts: e.target[0].value,
          username: e.target[1].value,
          password: e.target[2].value,
          port: Number(e.target[3].value),
        };
        invoke("connect", { payload })
        .then(message => {
          console.info("Connection: ", message);

          let connections = localStorage.getItem("conns");
          if (connections === "" || connections === null) {
            localStorage.setItem("conns", JSON.stringify([payload]));
          } else {
            connections = JSON.parse(connections);
            connections.push(payload);
            localStorage.setItem("conns", JSON.stringify(connections));
          }

          navigate("/schema", { state: { host: e.target[0].value } });
        })
        .catch(e => console.error(e));
      }}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Control style={inputStyle} placeholder="Enter hosts (comma separated)" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Control style={inputStyle} placeholder="Enter username" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Control style={inputStyle} type="password" placeholder="Enter password" />
        </Form.Group>


        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Control style={inputStyle} max={99999} type="number" placeholder="Enter port" />
        </Form.Group>

        <Button style={{ fontSize: '13px' }} variant="outline-light" type="submit">
          Submit
        </Button>
      </Form>

      <br />
      <b>Saved</b>
      <br />
      <br />
      <Row>
      {conns.map(conn => 
          (
            <Col xs={6} md={4}>
            <Card style={{ backgroundColor: '#242526', fontSize: '13px' }} >
              <Card.Header>{conn.hosts}</Card.Header>
              <Card.Body>
                {conn.username}
              </Card.Body>
              <Card.Footer style={{display: 'flex', flexDirection: 'row-reverse', backgroundColor: '#242526'}}>
              <Button style={{ fontSize: '13px' }} variant='success' onClick={() => {
                  invoke("connect", { payload: conn })
                  .then(message => {
                    console.info("Connection: ", message);
          
                    navigate("/schema", { state: { host: conn.hosts } });
                  })
                  .catch(e => console.error(e))
                }}>Connect</Button>
              </Card.Footer>
            </Card>
            </Col>
          )
      )}
      </Row>
      
    </div>
  );
}

export default App;
