import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocalAIService from '../services/localAI';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  attachment?: {
    name: string;
    type: string;
    size: number;
  };
}

type RootStackParamList = {
  Ask: { initialQuestion?: string };
};

type AskScreenRouteProp = RouteProp<RootStackParamList, 'Ask'>;

export default function AskScreen() {
  const route = useRoute<AskScreenRouteProp>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your secure health AI assistant. I can help you understand your health data, answer questions about your biological age, and provide personalized health insights. You can also upload documents for analysis. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize AI service and handle initial question
  useEffect(() => {
    const initializeAI = async () => {
      await LocalAIService.initialize();
      
      // Handle initial question from navigation params
      const initialQuestion = route.params?.initialQuestion;
      if (initialQuestion) {
        // Auto-send the initial question
        setTimeout(() => {
          setInputText(initialQuestion);
          // Auto-submit after a short delay
          setTimeout(() => {
            sendMessage(initialQuestion);
          }, 500);
        }, 1000);
      }
    };

    initializeAI();
  }, [route.params?.initialQuestion]);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadedFile(file);
        
        // Add message with file attachment
        const fileMessage: Message = {
          id: Date.now().toString(),
          text: `📎 Uploaded: ${file.name}`,
          isUser: true,
          timestamp: new Date(),
          attachment: {
            name: file.name,
            type: file.mimeType || 'unknown',
            size: file.size || 0,
          },
        };

        setMessages(prev => [...prev, fileMessage]);
        setIsTyping(true);

        // AI response for file upload
        setTimeout(() => {
          const aiResponse = `I've received your file "${file.name}". I can help analyze document content, answer questions about the information, or provide insights based on the data. What would you like to know about this document?`;
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: aiResponse,
            isUser: false,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, aiMessage]);
          setIsTyping(false);
        }, 1500);
      }
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload file. Please try again.');
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputText.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInputText('');
    setIsTyping(true);

    try {
      // Use LocalAI service for response
      const aiResponse = await LocalAIService.generateResponse(text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble processing your request right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ask Secure AI</Text>
          <Text style={styles.headerSubtitle}>Your Personal Health Assistant</Text>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.aiMessageText,
              ]}>
                {message.text}
              </Text>
              {message.attachment && (
                <View style={styles.attachmentInfo}>
                  <Text style={[
                    styles.attachmentText,
                    message.isUser ? styles.userMessageText : styles.aiMessageText,
                  ]}>
                    📄 {message.attachment.name} ({(message.attachment.size / 1024).toFixed(1)} KB)
                  </Text>
                </View>
              )}
              <Text style={[
                styles.timestamp,
                message.isUser ? styles.userTimestamp : styles.aiTimestamp,
              ]}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
          
          {isTyping && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>AI is typing</Text>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleFileUpload}
          >
            <Text style={styles.uploadButtonText}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your health data..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 50,
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 18,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#999',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  uploadButtonText: {
    fontSize: 18,
    color: 'white',
  },
  attachmentInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  attachmentText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});