import React from 'react';

// This component safely handles textContent by checking for null values
const SafeContent = ({ element, fallback = '', className = '' }) => {
  const [content, setContent] = React.useState(fallback);
  
  React.useEffect(() => {
    // Only try to access textContent if element exists
    if (element && element.textContent) {
      setContent(element.textContent);
    }
  }, [element]);
  
  return <span className={className}>{content}</span>;
};

export default SafeContent;
