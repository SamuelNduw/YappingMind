import axios from 'axios';
import { useEffect, useState } from 'react';

function APITesting() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8080/register')
      .then((response) => {
        setNotes(response.data);
        console.log(response.data)
      })
      .catch((error) => {
        console.error('Error fetching data from Ballerina backend:', error);
      });
  }, []);

  return (
    <div>
      <h1>User Notes</h1>
      <ul>
        {notes.map((note) => (
          <li key={note.note_id}>
          <h3>Note ID: {note.note_id}</h3>
          <p><strong>Content:</strong> {note.note_content}</p>
          <p><strong>Converted:</strong> {note.converted ? 'Yes' : 'No'}</p>
          <p><strong>Created At:</strong> {note.created_at}</p>
          <p><strong>Updated At:</strong> {note.updated_at}</p>
          <p><strong>User ID:</strong> {note.user_id}</p>
        </li>
        ))}
      </ul>
    </div>
  );
}

export default APITesting;
