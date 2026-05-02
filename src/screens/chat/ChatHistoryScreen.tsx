import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ProfileStackParamList, MainTabParamList, HomeStackParamList } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { tr } from '../../locales/tr';
import apiClient from '../../api/client';

type ChatHistoryScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ProfileStackParamList, 'ChatHistory'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    StackNavigationProp<HomeStackParamList>
  >
>;

interface Props {
  navigation: ChatHistoryScreenNavigationProp;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  createdAt: string;
}

const ChatHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await apiClient.get('/ai/conversations');
      setConversations(response?.data ?? []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      Alert.alert(tr.common.error, 'Sohbet geçmişi yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations(true);
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Navigate to Home tab first, then to Chat screen
    (navigation as any)?.navigate?.('Home', {
      screen: 'Chat',
      params: { conversationId: conversation?.id },
    });
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      tr.chat.deleteConversation,
      tr.chat.deleteConfirm,
      [
        { text: tr.common.cancel, style: 'cancel' },
        {
          text: tr.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/ai/conversations/${conversationId}`);
              setConversations((prev) => prev?.filter?.((c) => c?.id !== conversationId) ?? []);
            } catch (error) {
              Alert.alert(tr.common.error, 'Sohbet silinemedi');
            }
          },
        },
      ],
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === conversations?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conversations?.map?.((c) => c?.id) ?? []));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      'Topluca Sil',
      `${selectedIds.size} sohbet silinecek. Emin misiniz?`,
      [
        { text: tr.common.cancel, style: 'cancel' },
        {
          text: tr.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all selected conversations
              await Promise.all(
                Array.from(selectedIds).map((id) =>
                  apiClient.delete(`/ai/conversations/${id}`)
                )
              );
              setConversations((prev) =>
                prev?.filter?.((c) => !selectedIds.has(c?.id)) ?? []
              );
              setSelectedIds(new Set());
              setSelectionMode(false);
            } catch (error) {
              Alert.alert(tr.common.error, 'Bazı sohbetler silinemedi');
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      } else if (diffDays === 1) {
        return 'Dün';
      } else if (diffDays < 7) {
        return `${diffDays} gün önce`;
      } else {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        return `${day}/${month}`;
      }
    } catch (error) {
      return '';
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const isSelected = selectedIds.has(item?.id);

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isSelected && styles.conversationItemSelected,
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item?.id);
          } else {
            handleConversationPress(item);
          }
        }}
        activeOpacity={0.7}
      >
        {selectionMode && (
          <View style={styles.checkboxContainer}>
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={24}
              color={isSelected ? colors.primary : colors.gray}
            />
          </View>
        )}
        <View style={styles.conversationIcon}>
          <Ionicons name="chatbubbles" size={24} color={colors.primary} />
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationTitle} numberOfLines={1}>
              {item?.title || 'Yeni Sohbet'}
            </Text>
            <Text style={styles.conversationTime}>
              {formatDate(item?.updatedAt)}
            </Text>
          </View>
          <Text style={styles.conversationPreview} numberOfLines={2}>
            {item?.lastMessage || ''}
          </Text>
        </View>
        {!selectionMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteConversation(item?.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const handleStartNewChat = () => {
    // Navigate to Home tab first, then to Chat screen (without conversationId)
    (navigation as any)?.navigate?.('Home', {
      screen: 'Chat',
      params: undefined,
    });
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color={colors.gray} />
      <Text style={styles.emptyTitle}>{tr.chat.noConversations}</Text>
      <Text style={styles.emptySubtitle}>{tr.chat.startChatting}</Text>
      <TouchableOpacity
        style={styles.startChatButton}
        onPress={handleStartNewChat}
      >
        <Ionicons name="add-circle" size={20} color={colors.white} />
        <Text style={styles.startChatButtonText}>Yeni Sohbet Başlat</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{tr.chat.historyTitle}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectionMode
            ? `${selectedIds.size} seçildi`
            : tr.chat.historyTitle}
        </Text>
        {!selectionMode ? (
          <TouchableOpacity onPress={toggleSelectionMode}>
            <Text style={styles.selectButton}>Seç</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={toggleSelectionMode}>
            <Text style={styles.selectButton}>İptal</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectionMode && conversations?.length > 0 && (
        <View style={styles.selectionToolbar}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={selectAll}
          >
            <Ionicons
              name={
                selectedIds.size === conversations?.length
                  ? 'checkbox'
                  : 'square-outline'
              }
              size={20}
              color={colors.white}
            />
            <Text style={styles.selectAllText}>
              {selectedIds.size === conversations?.length
                ? 'Tümünü Kaldır'
                : 'Tümünü Seç'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteSelectedButton,
              selectedIds.size === 0 && styles.deleteSelectedButtonDisabled,
            ]}
            onPress={handleDeleteSelected}
            disabled={selectedIds.size === 0}
          >
            <Ionicons name="trash" size={20} color={colors.white} />
            <Text style={styles.deleteSelectedText}>
              Sil ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item?.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          conversations?.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#292929',
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '600',
  },
  selectButton: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  selectionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectAllText: {
    ...typography.body,
    color: colors.white,
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  deleteSelectedButtonDisabled: {
    backgroundColor: colors.gray,
    opacity: 0.5,
  },
  deleteSelectedText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  conversationItemSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  checkboxContainer: {
    marginRight: spacing.sm,
  },
  conversationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  conversationTime: {
    ...typography.caption,
    color: colors.gray,
  },
  conversationPreview: {
    ...typography.bodySmall,
    color: colors.gray,
  },
  deleteButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.white,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  startChatButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});

export default ChatHistoryScreen;
