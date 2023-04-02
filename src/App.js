import './App.css';
import React, { useEffect, useReducer } from 'react';
import { API } from 'aws-amplify';
import { List, Input, Button } from 'antd';
import { listNotes } from './graphql/queries';
import { v4 as uuid } from 'uuid';
import { 
  createNote as CreateNote,
  deleteNote as DeleteNote,
  updateNote as UpdateNote
} from './graphql/mutations';
import { onCreateNote } from './graphql/subscriptions';

const CLIENT_ID = uuid();

const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: '', description: '' }
};

const reducer = (state, action) => {
  switch(action.type) {
    case 'SET_NOTES':
      return { ...state, notes: action.notes, loading: false };
    case 'ADD_NOTE':
      return { ...state, notes: [action.note, ...state.notes]};
    case 'RESET_FORM':
      return { ...state, form: initialState.form };
    case 'SET_INPUT':
      return { ...state, form: { ...state.form, [action.name]: action.value } }
    case 'ERROR':
      return { ...state, loading: false, error: true };
    default:
      return { ...state};
  }
};

const App = () => {
  
  const [state, dispatch] = useReducer(reducer, initialState);
  
  const fetchNotes = async() => {
    try {
      const notesData = await API.graphql({
        query: listNotes
      })
      dispatch({ type: 'SET_NOTES', notes: notesData.data.listNotes.items });
    } catch (err) {
      console.log('error: ', err);
      dispatch({ type: 'ERROR' });
    }
  };
  
  const createNote = async() => {

    const { form } = state;
    if (!form.name || !form.description) {
      return alert('Your note needs a name and description');
    };

    const note = { ...form, clientId: CLIENT_ID, complete: false, id: uuid() };
    dispatch({ type: 'ADD_NOTE', note });
    dispatch({ type: 'RESET_FORM' });
    try {
      await API.graphql({
        query: CreateNote,
        variables: { input: note }
      });
      console.log('You created a note!');
    } catch (err) {
      console.log("error: ", err);
    };
    
  };
  
  const updateNote = async(note) => {
    const index = state.notes.findIndex(n => n.id === note.id);
    const notes = [...state.notes];
    notes[index].complete = !note.complete;
    dispatch({ type: 'SET_NOTES', notes })
    try {
      await API.graphql({
        query: UpdateNote,
        variables: { input: { 
          id: note.id, complete: notes[index].complete }
        }
      });
      console.log('You updated a note');
    } catch (err) {
      console.log('error: ', err)
    };
  };

  const deleteNote = async({ id }) => {
    const index = state.notes.findIndex(n => n.id === id);
    const notes = [
      ...state.notes.slice(0, index),
      ...state.notes.slice(index + 1)
    ];
    dispatch({ type: 'SET_NOTES', notes })
    try { await API.graphql({
        query: DeleteNote,
        variables: { input: { id } }
      });
      console.log('You deleted a note');
    } catch (err) {
      console.log({ err });
    };
  };
  // enter the subscription function here...
  // so it's talking about doing what already seems to be happening...
  
  const onChange = (e) => dispatch({ 
    type: 'SET_INPUT', 
    name: e.target.name, 
    value: e.target.value
  });
  
  useEffect(() => {
    fetchNotes();
  }, []);
  
  const styles = {
    container: {padding: 20},
    input: {marginBottom: 10},
    item: { textAlign: 'left'},
    p: { color: '#1890ff' }
  };
  
  const renderItem = (item) => (
    <List.Item 
      style={styles.item}
      actions={[
        <>
          <p style={styles.p}
            onClick={() => deleteNote(item)}
          >Delete</p>
          <p style={styles.p}
            onClick={() => updateNote(item)}
          >
            {item.complete ? 'Complete' : 'Mark Complete'}
          </p>
        </>        
      ]}>
      <List.Item.Meta 
        title={item.name}
        description={item.description}
      />
    </List.Item>
  );

  return (
    <div style={styles.container}>
      <Input 
        onChange={onChange}
        value={state.form.name}
        placeholder="Name your note"
        name='name'
        style={styles.input}
      />
      <Input 
        onChange={onChange}
        value={state.form.description}
        placeholder="Describe your note"
        name='description'
        style={styles.input}
      />
      <Button
        onClick={createNote}
        type="primary"
      >Create This Note</Button>
      <List 
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

export default App;
