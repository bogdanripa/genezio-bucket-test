import { useState, useEffect, useRef } from "react";
import { BackendService } from "@genezio-sdk/buckets-test";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';
import "./App.css";
Modal.setAppElement('#root');

export default function App() {
  const [list, setList] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [longText, setLongText] = useState('');
  const textContainerRef = useRef<HTMLDivElement>(null);
  const interval = useRef<number>(0);

  const fetchStreamedData = async (item: string) => {
    try {
        setLongText('');
        const response = await fetch(import.meta.env.VITE_STREAM_URL + "?file=" + item);
        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let receivedText = '';

        while (true && reader) {
            const { value, done } = await reader.read();
            if (done) break;

            // Decode and append new text
            receivedText += decoder.decode(value, { stream: true });
            setLongText((prev) => prev + receivedText);

            // Scroll to bottom of the container
            if (textContainerRef.current) {
                textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
            }
        }
    } catch (error) {
        console.error('Error fetching streamed data:', error);
    }
  }

  const refreshList = async () => {
    const res = await BackendService.list();
    setList(res);
  }

  const create = async () => {
    toast("Creating file...");
    const res = await BackendService.create();
    await refreshList();
    toast(res);
  }

  const deleteFile = async(item: string) => {
    toast("Deleting file...");
    const res = await BackendService.delete(item);
    await refreshList();
    toast(res);
  }

  const streamFile = async(item: string) => {
    fetchStreamedData(item);
    setIsOpen(true);
  }

  const scrollDown = () => {
    if (isOpen && textContainerRef.current) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    refreshList();
    if (!interval.current) {
      interval.current = window.setInterval(scrollDown, 1000);
    }
  }, []);

  return (
    <>
      <h1>Container Tests</h1>
      <ul>
        {list.map((item, index) => 
          <li key={index}>
            {item}
            &nbsp;
            <a href="#" onClick={() => deleteFile(item)}>Delete</a>
            &nbsp;
            <a href="#" onClick={() => streamFile(item)}>Stream</a>
            </li>
        )}
      </ul>
      <div className="card">
        <button onClick={() => create()}>Create</button>
      </div>
      <ToastContainer
          position="top-right"   // Position (top-right, top-left, bottom-right, etc.)
          autoClose={3000}       // Auto dismiss after 3 seconds
          hideProgressBar={false} // Show or hide progress bar
          closeOnClick           // Dismiss on click
          pauseOnHover           // Pause on hover
          draggable               // Allow dragging to dismiss
        />
                        <Modal
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                style={{
                    content: {
                        top: '50%',
                        left: '10%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-10%',
                        transform: 'translate(-10%, -50%)',
                        padding: '20px',
                        width: '90%',
                        borderRadius: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    },
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    },
                }}
            >
                <h2>Streaming...</h2>
                <div
                    ref={textContainerRef}
                    style={{
                        maxHeight: '200px', // Adjust the height of the scrollable area
                        overflowY: 'auto',
                        border: '1px solid #ccc',
                        padding: '10px',
                        borderRadius: '5px',
                        backgroundColor: '#f9f9f9',
                    }}
                >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {longText}
                    </pre>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ marginTop: '10px' }}>
                    Close
                </button>
            </Modal>


    </>
  );
}