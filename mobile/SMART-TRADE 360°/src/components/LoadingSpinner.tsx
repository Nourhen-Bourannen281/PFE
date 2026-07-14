import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Animated
} from 'react-native';

interface LoadingSpinnerProps {
  visible: boolean;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible,
  text = 'Chargement...',
  fullScreen = true
}) => {
  const [spinAnim] = React.useState(new Animated.Value(0));
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        )
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
      spinAnim.setValue(0);
    }
  }, [visible]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const SpinnerContent = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.spinnerContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <ActivityIndicator size="large" color="#1a3c5e" />
        </Animated.View>
        <Text style={styles.text}>{text}</Text>
      </View>
    </Animated.View>
  );

  if (fullScreen) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <SpinnerContent />
      </Modal>
    );
  }

  return visible ? <SpinnerContent /> : null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  spinnerContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  text: {
    marginTop: 15,
    fontSize: 14,
    color: '#555'
  }
});

export default LoadingSpinner;