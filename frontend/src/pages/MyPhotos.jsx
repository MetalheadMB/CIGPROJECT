import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fileToImage } from '../utils/image.js';
import { extractPrimaryDescriptor } from '../utils/face.js';
import MediaCard from '../components/MediaCard.jsx';
import { Spinner, Empty } from '../components/ui.jsx';

export default function MyPhotos() {
  const { refresh } = useAuth();
  const fileInput = useRef();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  async function matchFromProfile() {
    setLoading(true);
    setStatus('Searching photos with your reference selfie…');
    try {
      const { data } = await api.post('/face/match-me');
      setResults(data.media);
      setStatus('');
    } catch (e) {
      setStatus(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function matchFromSelfie(file) {
    setLoading(true);
    setResults(null);
    setStatus('Analyzing your selfie in your browser…');
    try {
      const { img } = await fileToImage(file);
      const descriptor = await extractPrimaryDescriptor(img);
      if (!descriptor) {
        setStatus('No face detected in that image. Try a clearer, front-facing selfie.');
        setLoading(false);
        return;
      }
      setStatus('Finding your photos…');
      const { data } = await api.post('/face/match', { descriptor });
      setResults(data.media);
      setStatus('');
    } catch (e) {
      setStatus(`Could not run face matching: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="section-head"><h2>My Photos · Find yourself</h2></div>

      <div className="panel">
        <p style={{ marginTop: 0 }}>
          Upload a selfie and we'll find every event photo you appear in — using facial recognition
          that runs entirely in your browser. Your face data never leaves as an image.
        </p>
        <div className="row wrap" style={{ gap: 10 }}>
          <button className="btn btn-primary" onClick={() => fileInput.current.click()} disabled={loading}>
            📷 Upload a selfie to search
          </button>
          <button className="btn" onClick={matchFromProfile} disabled={loading}>
            Use my saved profile selfie
          </button>
          <Link to="/profile" className="btn btn-ghost">Set profile selfie →</Link>
          <input ref={fileInput} type="file" accept="image/*" hidden
            onChange={(e) => e.target.files[0] && matchFromSelfie(e.target.files[0])} />
        </div>
        {status && <div className="alert-info mt">{status}</div>}
      </div>

      <div className="mt-2">
        {loading ? (
          <Spinner />
        ) : results === null ? null : results.length === 0 ? (
          <Empty icon="🙈" title="No matches found">We couldn't find photos with your face yet.</Empty>
        ) : (
          <>
            <div className="section-head"><h3>{results.length} photo(s) found</h3></div>
            <div className="masonry">
              {results.map((m) => (
                <div key={m.id} style={{ position: 'relative' }}>
                  <MediaCard media={m} />
                  {m.matchConfidence != null && (
                    <span className="badge badge-public" style={{ position: 'absolute', top: 8, left: 8 }}>
                      {m.matchConfidence}% match
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
