import { useState } from 'react';

const FileSharingAdvanced = () => {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [dragActive, setDragActive] = useState(false);

  /* 📂 HANDLE FILES */
  const processFiles = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map((file) => ({
      id: Date.now() + file.name,
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type,
      url: URL.createObjectURL(file),
      time: new Date().toLocaleTimeString(),
      progress: 100,
    }));

    setFiles((prev) => [...newFiles, ...prev]);
  };

  /* 📤 UPLOAD */
  const handleUpload = (e) => {
    processFiles(e.target.files);
  };

  /* 🖱 DRAG DROP */
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  /* 🗑 DELETE */
  const deleteFile = (id) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  /* 🔍 SEARCH */
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  /* 📄 ICON */
  const getIcon = (type) => {
    if (type.includes('image')) return '🖼';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('video')) return '🎥';
    return '📁';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        📂 File Sharing System
      </h1>

      {/* 🔍 SEARCH */}
      <div className="max-w-xl mx-auto mb-4">
        <input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-xl border"
        />
      </div>

      {/* 📂 DRAG AREA */}
      <div
        className={`max-w-xl mx-auto mb-6 p-6 border-2 border-dashed rounded-xl text-center cursor-pointer
        ${dragActive ? 'bg-blue-200' : 'bg-white'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <p>Drag & Drop files here</p>

        <input type="file" multiple onChange={handleUpload} />
      </div>

      {/* 📂 FILE LIST */}
      <div className="max-w-xl mx-auto space-y-3">
        {filteredFiles.length === 0 && (
          <p className="text-center text-gray-500">No files</p>
        )}

        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center hover:scale-[1.02] transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getIcon(file.type)}</span>

              <div>
                <p className="font-semibold">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {file.size} • {file.time}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {/* Preview */}
              {file.type.includes('image') && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-600"
                >
                  View
                </a>
              )}

              {/* Download */}
              <a href={file.url} download={file.name} className="text-blue-600">
                Download
              </a>

              {/* Delete */}
              <button
                onClick={() => deleteFile(file.id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileSharingAdvanced;
