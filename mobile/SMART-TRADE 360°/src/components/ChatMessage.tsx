import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    suggestions?: string[];
  };
  onSuggestionPress?: (suggestion: string) => void;
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSuggestionPress,
  isTyping
}) => {
  const [scaleAnim] = React.useState(new Animated.Value(0.8));
  const [opacityAnim] = React.useState(new Animated.Value(0));
  const [dot1Anim] = React.useState(new Animated.Value(0.3));
  const [dot2Anim] = React.useState(new Animated.Value(0.3));
  const [dot3Anim] = React.useState(new Animated.Value(0.3));

  React.useEffect(() => {
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
  }, []);

  React.useEffect(() => {
    if (isTyping) {
      // Animation pour les points de typing
      const animateDot = (animValue: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              delay: delay,
              useNativeDriver: true
            }),
            Animated.timing(animValue, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true
            })
          ])
        ).start();
      };

      animateDot(dot1Anim, 0);
      animateDot(dot2Anim, 200);
      animateDot(dot3Anim, 400);
    }
  }, [isTyping, dot1Anim, dot2Anim, dot3Anim]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TypingIndicator = () => (
    <View style={styles.typingContainer}>
      <Animated.View
        style={[
          styles.typingDot,
          {
            opacity: dot1Anim,
            transform: [{ scale: dot1Anim }]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.typingDot,
          {
            opacity: dot2Anim,
            transform: [{ scale: dot2Anim }]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.typingDot,
          {
            opacity: dot3Anim,
            transform: [{ scale: dot3Anim }]
          }
        ]}
      />
    </View>
  );

  if (isTyping) {
    return (
      <Animated.View
        style={[
          styles.container,
          styles.botContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={[styles.bubble, styles.botBubble]}>
          <TypingIndicator />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        message.isUser ? styles.userContainer : styles.botContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View
        style={[
          styles.bubble,
          message.isUser ? styles.userBubble : styles.botBubble
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.botText
          ]}
        >
          {message.text}
        </Text>
        <Text style={styles.timeText}>
          {formatTime(message.timestamp)}
        </Text>
      </View>

      {!message.isUser && message.suggestions && message.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {message.suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => onSuggestionPress?.(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    maxWidth: screenWidth - 60
  },
  userContainer: {
    alignSelf: 'flex-end'
  },
  botContainer: {
    alignSelf: 'flex-start'
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%'
  },
  userBubble: {
    backgroundColor: '#1a3c5e',
    borderBottomRightRadius: 4
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20
  },
  userText: {
    color: '#fff'
  },
  botText: {
    color: '#333'
  },
  timeText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'right'
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginLeft: 8
  },
  suggestionChip: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1a3c5e'
  },
  suggestionText: {
    fontSize: 12,
    color: '#1a3c5e',
    fontWeight: '500'
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2
  }
});

export default ChatMessage;