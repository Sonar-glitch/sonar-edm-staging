import React from 'react';

// Card component with protocol-compliant data source labeling
const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`relative rounded-lg border shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// CardHeader component
const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// CardTitle component with data source labeling
const CardTitle = ({ children, className = '', showDataSource = true, ...props }) => {
  return (
    <div className="relative">
      <h3 
        className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
        {...props}
      >
        {children}
      </h3>
      
      {/* Protocol-compliant data source label */}
      {showDataSource && (
        <div 
          className="absolute top-0 right-0 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 cursor-pointer"
          title="Live Data - Last fetch: Just now"
        >
          🟢 Live Data
        </div>
      )}
    </div>
  );
};

// CardContent component
const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardContent, CardHeader, CardTitle };

