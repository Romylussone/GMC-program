import { useEffect, useState } from 'react';
import axios from 'axios';

function UserList() {
  const [listOfUser, setListOfUser] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getUsers = async () => {
      try {
        const response = await axios.get('https://jsonplaceholder.typicode.com/users');
        setListOfUser(response.data);
      } catch (requestError) {
        setError('We could not load the user list. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    getUsers();
  }, []);

  if (isLoading) return <p className="status">Loading users…</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <ul className="user-grid" aria-label="Users">
      {listOfUser.map((user) => (
        <li className="user-card" key={user.id}>
          <div className="avatar" aria-hidden="true">{user.name.charAt(0)}</div>
          <div>
            <h2>{user.name}</h2>
            <p className="username">@{user.username}</p>
            <a href={`mailto:${user.email}`}>{user.email}</a>
            <p className="company">{user.company.name}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default UserList;
