import './App.css';
import React, { useEffect, useReducer } from 'react';
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
  // copy from book... i think this is the right spot...
  const [state, dispatch] = useReducer(reducer, initialState);
  // add fetch notes function
  const fetchNotes = async() => {
    try {
      const notesData = await API.graphql({
        query: listNotes
      })
      dispatch({ type: 'SET_NOTES', notes: notesData.listNotes.items })
    } catch (err) {
      console.log('error: ', err)
      dispatch({ type: 'ERROR' })
    }
  };
  // invoke the fetch notes
  useEffect(() => {
    fetchNotes()
  }, []);

  return (
    <div className="App">
      <h1>Hello, this works for now</h1>
    </div>
  );
}

export default App;
