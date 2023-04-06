import './App.css';
import React, { 
  useEffect, 
  useReducer,
  useState
} from 'react';
import { API } from 'aws-amplify';
import { 
  List, 
  Input, 
  Button,
  Space
} from 'antd';
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
  const [assignment, setAssignment] = useState('');

  const fetchNotes = async() => {
    try {
      const notesData = await API.graphql({
        query: listNotes
      })
      dispatch({ 
        type: 'SET_NOTES', 
        notes: notesData.data.listNotes.items });
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
    const note = { 
      ...form, 
      clientId: CLIENT_ID, 
      complete: false, id: uuid() 
    };
    dispatch({ type: 'ADD_NOTE', note });
    dispatch({ type: 'RESET_FORM' });
    try {
      await API.graphql({
        query: CreateNote,
        variables: { input: note }
      });
    } catch (err) {
      console.log("error: ", err);
    };    
  };
  
  const updateNote = async(note) => {
    const notes = [...state.notes];
    const makeChange = notes.filter(x => x.id === note.id);
    makeChange[0].complete = !note.complete;
    dispatch({ type: 'SET_NOTES', notes })
    try {
      await API.graphql({
        query: UpdateNote,
        variables: { input: { 
          id: note.id, complete: makeChange[0].complete }
        }
      });
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
    } catch (err) {
      console.log({ err });
    };
  };

  const assignNote = async(note, x) => {
    const index = state.notes.findIndex(n => n.id === note.id);
    const notes = [...state.notes];
    notes[index].assign = x;
    dispatch({ type: 'SET_NOTES', notes })
    try {
      await API.graphql({
        query: UpdateNote,
        variables: { input: { 
          id: note.id, assign: notes[index].assign }
        }
      });
    } catch (err) {
      console.log('error: ', err)
    };
  }
  
  const onChange = (e) => dispatch({ 
    type: 'SET_INPUT', 
    name: e.target.name, 
    value: e.target.value
  });

  useEffect(() => {
    fetchNotes();
    const subscription = API.graphql({
      query: onCreateNote
    })
      .subscribe({
        next: noteData => {
          const note = noteData.value.data.onCreateNote;
          if (CLIENT_ID === note.clientId) return
          dispatch({ type: 'ADD_NOTE', note })
        }
    })
    return () => subscription.unsubscribe();
  }, []);
  
  const styles = {
    container: {padding: 20},
    input: {marginBottom: 10},
    item: { textAlign: 'left'},
    p: { color: '#1890ff' }
  };

  

  const latestFuncAttempt = (e) => {
    const item = e;
    const grant = assignment;
    assignNote(item, grant);
  }

  const showAssign = (item) => (
    <>
      <Input 
        handleChange={e => setAssignment(e.target.value)}
        placeholder="Assign this note"
        style={styles.input}
      />
      <Button
        onClick={() => latestFuncAttempt(item)}
      >Assign</Button>
    </>
    );
  
  const renderItem = (item) => (
    <List.Item 
      style={styles.item}
      actions={[
        <>
          <Space>
            <span>
              { item.assign ? '' : showAssign(item) }
            </span>
              { item.assign ? '' : '||' }
            <span
              onClick={() => updateNote(item)}
            >
              {item.complete ? 'Complete' : 'Mark Complete'}
            </span>
              ||
            <span
              onClick={() => deleteNote(item)}
            >
              Delete
            </span>
          </Space>          
        </>        
      ]}>
      <List.Item.Meta 
        title={item.name}
        description={item.assign}
      />
      {item.description}
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
      <Input 
        onChange={onChange}
        value={state.form.assign}
        placeholder="Whose note is this?"
        name='assign'
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
