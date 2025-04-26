const fs = require('fs');
const path = require('path');

// Create the placeholders directory if it doesn't exist
const placeholdersDir = path.join(__dirname);
if (!fs.existsSync(placeholdersDir)) {
  fs.mkdirSync(placeholdersDir, { recursive: true });
}

// Base64 encoded 16:9 placeholder image (blue gradient)
const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAD6CAYAAABXq7VOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABQSURBVHhe7cExAQAAAMKg9U/tbwagAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBnDV+AAWCzfJYAAAAASUVORK5CYII=';

// Create different sizes of placeholder images
const sizes = [
  { name: 'event_placeholder_small.jpg', width: 100, height: 56 },
  { name: 'event_placeholder_medium.jpg', width: 300, height: 169 },
  { name: 'event_placeholder_large.jpg', width: 800, height: 450 }
];

// Extract the base64 data (remove the data:image/png;base64, part)
const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
const buffer = Buffer.from(base64Data, 'base64');

// Save the images
sizes.forEach(size => {
  const filePath = path.join(placeholdersDir, size.name);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created placeholder image: ${size.name}`);
});

console.log('All placeholder images created successfully');
