import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [joinId, setJoinId] = useState('');

  const navigate = useNavigate();

  const generateRoomId = () => Math.random().toString(36).substring(2, 8);

  const createRoom = () => {
    if (!roomName.trim()) return alert('Enter room name');

    const newRoom = {
      id: generateRoomId(),
      name: roomName,
    };

    setRooms([...rooms, newRoom]);
    setRoomName('');

    navigate(`/rooms/${newRoom.id}`);
  };

  const joinRoom = () => {
    if (!joinId.trim()) return alert('Enter Room ID');
    navigate(`/rooms/${joinId}`);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-100 to-indigo-100">
      <h1 className="text-3xl font-bold mb-6 text-center">🏫 Study Rooms</h1>

      {/* Create */}
      <div className="max-w-xl mx-auto bg-white p-4 rounded-xl shadow mb-4">
        <input
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button
          onClick={createRoom}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Create Room
        </button>
      </div>

      {/* Join */}
      <div className="max-w-xl mx-auto bg-white p-4 rounded-xl shadow mb-4">
        <input
          placeholder="Room ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button
          onClick={joinRoom}
          className="w-full bg-green-500 text-white p-2 rounded"
        >
          Join Room
        </button>
      </div>

      {/* Rooms List */}
      <div className="max-w-xl mx-auto">
        <h3 className="font-semibold mb-2">Available Rooms</h3>

        {rooms.length === 0 && <p className="text-gray-500">No rooms yet</p>}

        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white p-4 rounded-xl shadow mb-3 flex justify-between items-center"
          >
            <div>
              <p className="font-bold">{room.name}</p>
              <p className="text-sm text-gray-500">ID: {room.id}</p>
            </div>

            <button
              onClick={() => navigate(`/rooms/${room.id}`)}
              className="bg-indigo-500 text-white px-3 py-1 rounded"
            >
              Enter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsPage;
