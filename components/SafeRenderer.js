// SafeRenderer.js - Prevents object rendering that causes React errors
export default function SafeRenderer({ data, fallback = null, renderProp = null }) {
  try {
    // If data is null, undefined, or empty, return fallback
    if (data == null) {
      return fallback;
    }

    // If data is an object (not string, number, boolean, or array), stringify it
    if (typeof data === 'object' && !Array.isArray(data)) {
      // Don't render raw objects that cause React error #130
      if (process.env.NODE_ENV === 'development') {
        console.warn('SafeRenderer: Prevented object rendering:', data);
      }
      return fallback || <span>Data object</span>;
    }

    // If renderProp is provided, use it to render the data
    if (renderProp && typeof renderProp === 'function') {
      return renderProp(data);
    }

    // For primitive values (string, number, boolean), render directly
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }

    // For arrays, render length or use fallback
    if (Array.isArray(data)) {
      return fallback || <span>{data.length} items</span>;
    }

    // Fallback for anything else
    return fallback;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('SafeRenderer error:', error);
    }
    return fallback || <span>Render error</span>;
  }
}
