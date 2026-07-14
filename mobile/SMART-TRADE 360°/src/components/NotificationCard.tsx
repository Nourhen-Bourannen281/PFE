import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder
} from 'react-native';

interface NotificationCardProps {
  notification: {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    isRead: boolean;
    createdAt: string;
    data?: any;
  };
  onPress: (id: string) => void;
  onDismiss?: (id: string) => void;
  onMarkRead?: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onDismiss,
  onMarkRead
}) => {
  const [translateX] = React.useState(new Animated.Value(0));
  const [itemHeight] = React.useState(new Animated.Value(80));

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        translateX.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50 && onDismiss) {
        // Supprimer l'élément
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -500,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(itemHeight, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false
          })
        ]).start(() => onDismiss(notification._id));
      } else {
        // Revenir à la position initiale
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 10
        }).start();
      }
    }
  });

  const getIconByType = () => {
    switch (notification.type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const getBackgroundColor = () => {
    if (notification.isRead) return '#fff';
    switch (notification.type) {
      case 'warning':
        return '#fff8e1';
      case 'error':
        return '#ffebee';
      case 'success':
        return '#e8f5e9';
      default:
        return '#e8f0fe';
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      case 'success':
        return '#4caf50';
      default:
        return '#1a3c5e';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours} h`;
    if (days < 7) return `il y a ${days} j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }],
          height: itemHeight,
          backgroundColor: getBackgroundColor(),
          borderLeftColor: getBorderColor()
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={() => {
          if (!notification.isRead && onMarkRead) {
            onMarkRead(notification._id);
          }
          onPress(notification._id);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getIconByType()}</Text>
        </View>

        <View style={styles.textContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, !notification.isRead && styles.unreadTitle]}>
              {notification.title}
            </Text>
            <Text style={styles.time}>{formatDate(notification.createdAt)}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        {!notification.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => onDismiss(notification._id)}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  content: {
    flexDirection: 'row',
    padding: 15,
    flex: 1
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center'
  },
  icon: {
    fontSize: 28
  },
  textContainer: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#1a3c5e'
  },
  time: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8
  },
  message: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a3c5e',
    alignSelf: 'center',
    marginLeft: 8
  },
  dismissButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dismissText: {
    fontSize: 16,
    color: '#999'
  }
});

export default NotificationCard;