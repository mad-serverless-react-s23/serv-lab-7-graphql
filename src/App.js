import './App.css';
import React, { useState, useReducer } from 'react';
import { API } from 'aws-amplify';
import { List } from 'antd';
import 'antd/dist/antd.css';
import { listNotes } from './graphql/queries';

const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: '', description: '' }
};



function App() {
  return (
    <div className="App">
      <h1>Hello, this works for now</h1>
    </div>
  );
}

export default App;
