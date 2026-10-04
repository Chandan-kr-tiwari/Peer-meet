
function App() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-3xl">
            PeerMeet
          </h1>

          <p className="text-base-content/70">
            Simple peer-to-peer video calling.
          </p>

          <div className="card-actions justify-end mt-4">
            <button className="btn btn-primary">
              Create Meeting
            </button>

            <button className="btn btn-outline">
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

