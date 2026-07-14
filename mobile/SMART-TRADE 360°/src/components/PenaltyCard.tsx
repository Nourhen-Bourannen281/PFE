import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal
} from 'react-native';

interface PenaltyCardProps {
  penalty: {
    _id: string;
    commandeId: any;
    dueDate: string;
    delayDays: number;
    penaltyAmount: number;
    status: 'pending' | 'paid' | 'waived';
    calculatedAt: string;
  };
  onPress?: (penalty: any) => void;
  onPay?: (id: string) => void;
}

const PenaltyCard: React.FC<PenaltyCardProps> = ({
  penalty,
  onPress,
  onPay
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [scaleAnim] = React.useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
      friction: 10
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10
    }).start();
  };

  const getStatusColor = () => {
    switch (penalty.status) {
      case 'paid':
        return '#4caf50';
      case 'waived':
        return '#ff9800';
      default:
        return '#f44336';
    }
  };

  const getStatusText = () => {
    switch (penalty.status) {
      case 'paid':
        return '✅ Payée';
      case 'waived':
        return '⏳ En attente';
      default:
        return '⚠️ En souffrance';
    }
  };

  const getSeverityLevel = (days: number) => {
    if (days <= 7) return { text: 'Léger', color: '#ff9800' };
    if (days <= 30) return { text: 'Modéré', color: '#f44336' };
    return { text: 'Critique', color: '#9c27b0' };
  };

  const severity = getSeverityLevel(penalty.delayDays);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => setShowDetails(true)}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              borderLeftColor: getStatusColor()
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.amount}>
              {penalty.penaltyAmount.toLocaleString('fr-FR')} TND
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>Retard</Text>
              <Text style={styles.infoValue}>{penalty.delayDays} jours</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>⚠️</Text>
              <Text style={styles.infoLabel}>Sévérité</Text>
              <Text style={[styles.infoValue, { color: severity.color }]}>
                {severity.text}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(100, (penalty.delayDays / 60) * 100)}%`,
                  backgroundColor: severity.color
                }
              ]}
            />
          </View>

          <Text style={styles.dateText}>
            Date limite: {new Date(penalty.dueDate).toLocaleDateString('fr-FR')}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Modal Détails */}
      <Modal
        visible={showDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de la pénalité</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Montant:</Text>
                <Text style={styles.detailValue}>
                  {penalty.penaltyAmount.toLocaleString('fr-FR')} TND
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Jours de retard:</Text>
                <Text style={styles.detailValue}>{penalty.delayDays} jours</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date d'échéance:</Text>
                <Text style={styles.detailValue}>
                  {new Date(penalty.dueDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Statut:</Text>
                <Text style={[styles.detailValue, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>

              {penalty.status === 'pending' && (
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => {
                    setShowDetails(false);
                    onPay?.(penalty._id);
                  }}
                >
                  <Text style={styles.payButtonText}>💳 Payer la pénalité</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  amount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 20
  },
  infoItem: {
    flex: 1,
    alignItems: 'center'
  },
  infoIcon: {
    fontSize: 20,
    marginBottom: 4
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: 3
  },
  dateText: {
    fontSize: 11,
    color: '#999'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '85%',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  modalClose: {
    fontSize: 20,
    color: '#999',
    padding: 5
  },
  modalBody: {
    padding: 18
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    fontSize: 14,
    color: '#666'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  payButton: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default PenaltyCard;