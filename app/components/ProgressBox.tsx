import React from "react";

interface ProgressBoxProps {
  progress: string;
}

const ProgressBox: React.FC<ProgressBoxProps> = ({ progress }) => {
  return (
    <div className="w-full max-w-md mb-6 bg-emerald-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-emerald-700">
        <h3 className="text-emerald-100 font-semibold">Loading Progress</h3>
      </div>
      <div className="p-4">
        <p className="text-emerald-200 text-sm break-words">{progress}</p>
      </div>
    </div>
  );
};

export default ProgressBox;
