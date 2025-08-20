import React from 'react';

const DebugInfo: React.FC = () => {
  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50">
      <div>🚀 App Loaded</div>
      <div>URL: {window.location.href}</div>
      <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
    </div>
  );
};

export default DebugInfo;
