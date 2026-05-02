import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DebugLogger, LogEntry } from '../utils/DebugLogger';

interface DebugScreenProps {
  onClose: () => void;
}

export const DebugScreen: React.FC<DebugScreenProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = DebugLogger.subscribe((newLogs) => {
      setLogs(newLogs);
      if (autoScroll && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return unsubscribe;
  }, [autoScroll]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FFA726';
      case 'error':
        return '#EF5350';
      default:
        return '#90CAF9';
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bug" size={24} color="#FFD700" />
          <Text style={styles.headerTitle}>Debug Logları</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{logs.length}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconButton, autoScroll && styles.iconButtonActive]}
            onPress={() => setAutoScroll(!autoScroll)}
          >
            <Ionicons
              name={autoScroll ? 'arrow-down-circle' : 'arrow-down-circle-outline'}
              size={24}
              color={autoScroll ? '#FFD700' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => DebugLogger.clear()}
          >
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logs */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.logsContainer}
        contentContainerStyle={styles.logsContent}
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>Henüz log yok</Text>
            <Text style={styles.emptySubtext}>
              Oyunu oynamaya başlayın, loglar burada görünecek
            </Text>
          </View>
        ) : (
          logs.map((log, index) => (
            <View key={index} style={styles.logEntry}>
              <View style={styles.logHeader}>
                <Ionicons
                  name={getLogIcon(log.type)}
                  size={16}
                  color={getLogColor(log.type)}
                />
                <Text style={styles.logTimestamp}>{log.timestamp}</Text>
              </View>
              <Text style={[styles.logMessage, { color: getLogColor(log.type) }]}>
                {log.message}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Screenshot alıp destek ekibine gönderin
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a2e',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
  },
  logsContainer: {
    flex: 1,
  },
  logsContent: {
    padding: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  logEntry: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a2e',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
