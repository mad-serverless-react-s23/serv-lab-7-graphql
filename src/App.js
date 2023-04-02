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
const reducer = (state, action) => {
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
  // now the render item function for the List
  const renderItem = (item) => (
    <List.Item style={StyleSheet.item}>
      <List.Item.Meta 
        title={item.name}
        description={item.description}
      />
    </List.Item>
  );

  return (
    <div style={StyleSheet.container}>
      <List 
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

export default App;
