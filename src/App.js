import './App.css';

import { invoke } from '@tauri-apps/api/tauri'
import { Form, Button } from 'react-bootstrap';
import { useRef } from 'react';

function App() {
  return (
    <div className="App">
      <h1>Connections</h1>

      <Form onSubmit={(e) => {
        e.preventDefault();
        invoke("connect", {
          payload: {
            hosts: e.target[0].value,
            username: e.target[1].value,
            password: e.target[2].value,
            port: Number(e.target[3].value),
          }
        })
      }}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Control placeholder="Enter hosts (comma separated)" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Control placeholder="Enter username" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Control type="password" placeholder="Enter password" />
        </Form.Group>


        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Control max={99999} type="number" placeholder="Enter port" />
        </Form.Group>

        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
}

export default App;
