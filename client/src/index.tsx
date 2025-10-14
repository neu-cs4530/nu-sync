import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import FakeStackOverflow from './components/fakestackoverflow';
import { FakeSOSocket } from './types/types';

const container = document.getElementById('root');

const App = () => {
  const [socket, setSocket] = useState<FakeSOSocket | null>(null);

  const serverURL = process.env.REACT_APP_SERVER_URL;

  if (serverURL === undefined) {
    throw new Error("Environment variable 'REACT_APP_SERVER_URL' must be defined");
  }

  useEffect(() => {
    if (!socket) {
      setSocket(io(serverURL));
    }

    return () => {
      if (socket !== null) {
        socket.disconnect();
      }
    };
  }, [socket, serverURL]);

  return (
    <Router>
      <FakeStackOverflow socket={socket} />
      <ToastContainer position='top-right' autoClose={3000} hideProgressBar={false} />
    </Router>
  );
};

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
