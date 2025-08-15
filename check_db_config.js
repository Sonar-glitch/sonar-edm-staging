console.log('MONGODB_URI:', process.env.MONGODB_URI ? '[CONFIGURED]' : '[NOT SET]');
console.log('MONGODB_DB:', process.env.MONGODB_DB || 'test');
console.log('Full URI (partial):', process.env.MONGODB_URI ? process.env.MONGODB_URI.split('?')[0] : 'not set');
