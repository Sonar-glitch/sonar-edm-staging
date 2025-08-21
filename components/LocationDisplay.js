import { useState } from 'react';
import styles from '../styles/LocationDisplay.module.css';

export default function LocationDisplay({ location, onUpdateLocation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLocation, setTempLocation] = useState(location);

  const handleChange = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdateLocation(tempLocation);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempLocation(location);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    setTempLocation({
      ...tempLocation,
      city: e.target.value
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.locationDisplay}>
        <span className={styles.icon}>📍</span>
        {isEditing ? (
          <div className={styles.editContainer}>
            <input
              type="text"
              value={tempLocation.city}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter city name"
            />
            <div className={styles.buttonGroup}>
              <button onClick={handleSave} className={styles.saveButton}>Save</button>
              <button onClick={handleCancel} className={styles.cancelButton}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <span className={styles.location}>{location.city}, ON, Canada</span>
            <button onClick={handleChange} className={styles.changeButton}>Change</button>
          </>
        )}
      </div>
    </div>
  );
}
