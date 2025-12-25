import React, { useState, useEffect } from 'react';
import './Notifications.css';

function NotificationManager() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'reminder', message: 'Vreme je za dnevno ponavljanje!', read: false, time: '10:00' },
    { id: 2, type: 'achievement', message: 'Čestitamo! Postigli ste novi rekord: 95% tačnosti!', read: false, time: 'Juče' },
    { id: 3, type: 'challenge', message: 'Novo takmičenje počinje za 1 sat!', read: true, time: '2 dana' },
    { id: 4, type: 'progress', message: 'Tvoj rang je porastao za 3 mesta!', read: true, time: '3 dana' }
  ]);

  const [reminderTime, setReminderTime] = useState('18:00');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  useEffect(() => {
    // Proveri dnevni reminder
    const checkDailyReminder = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (reminderEnabled && currentTime === reminderTime) {
        if (Notification.permission === 'granted') {
          new Notification('Podsetnik za učenje', {
            body: 'Vreme je da ponoviš pitanja iz Agilnog IT poslovanja!',
            icon: '/logo.png'
          });
        }
      }
    };

    const interval = setInterval(checkDailyReminder, 60000); // Proveri svaki minut
    return () => clearInterval(interval);
  }, [reminderTime, reminderEnabled]);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          alert('Notifikacije su omogućene!');
        }
      });
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const addReminder = () => {
    const newNotification = {
      id: Date.now(),
      type: 'reminder',
      message: `Podsetnik podešen za ${reminderTime}`,
      read: false,
      time: 'Sada'
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>🔔 Notifikacije</h2>
        <button 
          className="permission-btn"
          onClick={requestNotificationPermission}
        >
          Omogući notifikacije
        </button>
      </div>

      <div className="reminder-settings">
        <h3>⏰ Dnevni podsetnik</h3>
        <div className="reminder-controls">
          <label>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
            />
            Omogući dnevne podsetnike
          </label>
          
          <div className="time-picker">
            <span>Vreme:</span>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              disabled={!reminderEnabled}
            />
            <button onClick={addReminder} disabled={!reminderEnabled}>
              Podesi
            </button>
          </div>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="notification-icon">
              {notification.type === 'reminder' && '⏰'}
              {notification.type === 'achievement' && '🏆'}
              {notification.type === 'challenge' && '⚡'}
              {notification.type === 'progress' && '📈'}
            </div>
            
            <div className="notification-content">
              <p className="notification-message">{notification.message}</p>
              <span className="notification-time">{notification.time}</span>
            </div>
            
            {!notification.read && <div className="unread-dot"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationManager;