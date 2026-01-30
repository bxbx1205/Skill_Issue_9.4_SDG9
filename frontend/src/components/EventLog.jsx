import { motion } from 'framer-motion';
import './EventLog.css';

function EventLog({ events }) {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '🔴';
      case 'WARNING': return '🟡';
      case 'INFO': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <div className="event-log">
      <div className="panel-header">
        <h2 className="panel-title">SYSTEM EVENTS</h2>
        <span className="event-count numeric">{events.length}</span>
      </div>
      
      <div className="events-list">
        {events.map((event, index) => (
          <motion.div
            key={`${event.timestamp}-${index}`}
            className={`event-item severity-${event.severity.toLowerCase()}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <div className="event-timestamp numeric">
              {new Date(event.timestamp).toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="event-machine">{event.machineId}</div>
            <div className="event-message">{event.message}</div>
            <div className={`event-severity badge badge-${event.severity.toLowerCase()}`}>
              {event.severity}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default EventLog;
