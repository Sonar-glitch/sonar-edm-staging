const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const dir = path.join('public', 'images', 'placeholders');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
}

// Create a simple SVG placeholder
const svgContent = `
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#333"/>
  <text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">Event Image</text>
</svg>
`;

// Write the SVG file
const svgPath = path.join(dir, 'event_placeholder_medium.svg');
fs.writeFileSync(svgPath, svgContent);
console.log(`Created SVG placeholder: ${svgPath}`);

console.log('Placeholder image created successfully!');
console.log('Note: For production, you may want to use a more visually appealing image.');
