import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Schema from './Schema';
import Namespace from './Namespace';
import reportWebVitals from './reportWebVitals';

import { Routes, Route, BrowserRouter } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path={"/"} element={<App/>} />
      <Route path={"/schema"} element={<Schema />} />
      <Route path="/ns/:namespace" element={<Namespace />} />
    </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
