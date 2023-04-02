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
// setting up reducer with only cases to set not array or error
function reducer(state, action) {
  switch(action.type) {
    case 'SET_NOTES':
      return { ...state, notes: action.notes, loading: false }
    case 'ERROR':
      return { ...state, loading: false, error: true }
    default:
      return state;
  }
};

function App() {
  return (
    <div className="App">
      <h1>Hello, this works for now</h1>
    </div>
  );
}

export default App;
