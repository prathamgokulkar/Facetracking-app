const StatusRow = ({ label, status }) => (
  <div className="flex justify-between text-sm ">
    <span className="font-medium">{label}</span>
    <span>{status}</span>
  </div>
);

export default function StatusCard({
  isRecording,
  modelsLoaded,
  faceDetected,
  fps,
}) {
  return (
    <div className="text-white shadow-lg rounded-xl p-4 w-full max-w-md mt-6">
      <h2 className="text-xl font-semibold mb-2 ">📊 Status</h2>
      <div className="space-y-2">
        <StatusRow
          label="Recording"
          status={isRecording ? "Active" : "Stopped"}
        />
        <StatusRow
          label="Models Loaded"
          status={modelsLoaded ? "Loaded" : "Loading..."}
        />
        <StatusRow label="Face Detected" status={faceDetected ? "Yes" : "No"} />
        <StatusRow label="FPS" status={`${fps} S`} />
      </div>
    </div>
  );
}
