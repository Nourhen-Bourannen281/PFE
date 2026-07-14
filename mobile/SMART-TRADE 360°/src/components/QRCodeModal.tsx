import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
  Animated,
  Clipboard
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  feature: {
    id: string;
    title: string;
    description: string;
    icon: string;
  };
  role: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  onClose,
  feature,
  role
}) => {
  const [scaleAnim] = React.useState(new Animated.Value(0.7));
  const [opacityAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const qrData = `etap://${feature.id}/${role.toLowerCase()}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Code QR pour ${feature.title}\nLien: ${qrData}`,
        title: `QR Code - ${feature.title}`
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager le QR code');
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setString(qrData);
      Alert.alert('Copié', 'Le lien a été copié dans le presse-papier');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de copier le lien');
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerIcon}>{feature.icon}</Text>
            <Text style={styles.title}>{feature.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrData}
                size={200}
                color="#1a3c5e"
                backgroundColor="#ffffff"
                logoSize={40}
                logoBackgroundColor="transparent"
              />
            </View>
          </View>

          <Text style={styles.instruction}>
            Scannez ce code QR avec votre application mobile ETAP
          </Text>

          <Text style={styles.featureDescription}>{feature.description}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <Text style={styles.copyButtonText}>📋 Copier le lien</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>📤 Partager</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Rôle requis: {role}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '85%',
    maxWidth: 350,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative'
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333'
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5
  },
  closeText: {
    fontSize: 20,
    color: '#999999',
    fontWeight: 'bold'
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  qrWrapper: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  instruction: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666666',
    marginBottom: 12
  },
  featureDescription: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999999',
    marginBottom: 20,
    fontStyle: 'italic'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#e8f0fe',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  copyButtonText: {
    color: '#1a3c5e',
    fontSize: 14,
    fontWeight: '500'
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#1a3c5e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500'
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#999999'
  }
});

export default QRCodeModal;