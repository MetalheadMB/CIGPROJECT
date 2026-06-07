import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { fileToImage, isImageFile } from '../utils/image.js';
import { generateTags, warmTagger } from '../utils/tagging.js';
import { extractFaces } from '../utils/face.js';

export default function Upload() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fileInput = useRef();

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(params.get('event') || '');
  const [albums, setAlbums] = useState([]);
  const [albumId, setAlbumId] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    warmTagger(); // preload the tagging model in the background
    api.get('/events').then(({ data }) => setEvents(data.events)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!eventId) return setAlbums([]);
    api.get(`/events/${eventId}`).then(({ data }) => setAlbums(data.event.albums || [])).catch(() => {});
  }, [eventId]);

  // Analyze a single image: smart tags + face descriptors (client-side AI)
  const analyze = useCallback(async (entry) => {
    if (!entry.isImage) return;
    try {
      const { img } = await fileToImage(entry.file);
      const [tags, faces] = await Promise.all([
        generateTags(img),
        extractFaces(img).catch(() => []),
      ]);
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, tags, faces, analyzing: false } : f))
      );
    } catch {
      setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, analyzing: false } : f)));
    }
  }, []);

  const addFiles = useCallback(
    (list) => {
      const incoming = Array.from(list).map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        previewUrl: URL.createObjectURL(file),
        isImage: isImageFile(file),
        tags: [],
        faces: [],
        analyzing: isImageFile(file),
      }));
      setFiles((prev) => [...prev, ...incoming]);
      incoming.forEach(analyze);
    },
    [analyze]
  );

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function submit() {
    setError('');
    if (!eventId) return setError('Please choose an event.');
    if (!files.length) return setError('Add at least one file.');

    const fd = new FormData();
    fd.append('eventId', eventId);
    if (albumId) fd.append('albumId', albumId);
    fd.append('visibility', visibility);
    const meta = files.map((f) => ({ tags: f.tags, faces: f.faces }));
    fd.append('meta', JSON.stringify(meta));
    files.forEach((f) => fd.append('files', f.file));

    setUploading(true);
    try {
      await api.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 100)),
      });
      navigate(`/events/${eventId}`);
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  }

  const stillAnalyzing = files.some((f) => f.analyzing);

  return (
    <>
      <div className="section-head"><h2>Upload media</h2></div>

      <div className="panel">
        {error && <div className="error-banner">{error}</div>}

        <div className="row wrap" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label>Event *</label>
            <select className="select" value={eventId} onChange={(e) => { setEventId(e.target.value); setAlbumId(''); }}>
              <option value="">Select an event…</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label>Album (optional)</label>
            <select className="select" value={albumId} onChange={(e) => setAlbumId(e.target.value)} disabled={!albums.length}>
              <option value="">— No album —</option>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ width: 180 }}>
            <label>Visibility</label>
            <select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private (members)</option>
            </select>
          </div>
        </div>

        <div
          className={`dropzone ${drag ? 'drag' : ''}`}
          onClick={() => fileInput.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          <div className="big">⬆️</div>
          <strong>Drag & drop photos / videos here</strong>
          <p className="small">or click to browse · bulk upload supported · AI tags & faces detected automatically</p>
          <input ref={fileInput} type="file" multiple accept="image/*,video/*" hidden
            onChange={(e) => addFiles(e.target.files)} />
        </div>

        {files.length > 0 && (
          <>
            <div className="row between mt">
              <span className="muted small">{files.length} file(s) ready {stillAnalyzing && '· analyzing…'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setFiles([])}>Clear all</button>
            </div>
            <div className="preview-grid">
              {files.map((f) => (
                <div key={f.id} className="preview-item">
                  {f.isImage ? <img src={f.previewUrl} alt="" /> : <video src={f.previewUrl} muted />}
                  <button className="rm" onClick={() => removeFile(f.id)}>×</button>
                  {f.analyzing && <span className="analyzing">AI…</span>}
                  {!f.analyzing && f.faces?.length > 0 && <span className="analyzing">😀 {f.faces.length}</span>}
                  {f.tags?.length > 0 && (
                    <div className="tags">{f.tags.slice(0, 3).map((t) => `#${t.name}`).join(' ')}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="divider" />
        <div className="row between">
          <span className="muted small">
            {uploading ? `Uploading… ${progress}%` : 'Tags & face data are computed in your browser before upload.'}
          </span>
          <button className="btn btn-primary" onClick={submit} disabled={uploading || stillAnalyzing || !files.length}>
            {uploading ? `Uploading ${progress}%` : `Upload ${files.length || ''}`}
          </button>
        </div>
      </div>
    </>
  );
}
