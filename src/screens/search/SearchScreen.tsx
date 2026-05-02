import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SearchStackParamList, Movie } from '../../types';
import { tmdbApi } from '../../api/tmdb';
import { MovieCard, ShimmerCard } from '../../components';
import { BannerAd } from '../../components/ads';
import { colors, typography, spacing, borderRadius } from '../../theme';

type SearchScreenNavigationProp = StackNavigationProp<SearchStackParamList, 'SearchScreen'>;

interface Props {
  navigation: SearchScreenNavigationProp;
}

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text?.trim()) {
      setResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const searchType = filter === 'all' ? undefined : filter;
        const response = await tmdbApi.search(text.trim(), searchType);
        setResults(response?.results ?? []);
      } catch (error) {
        if (__DEV__) { console.error('Search error:', error); }
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [filter]);

  const handleFilterChange = (newFilter: 'all' | 'movie' | 'tv') => {
    setFilter(newFilter);
    if (query?.trim()) {
      handleSearch(query);
    }
  };

  const handleMoviePress = (item?: Movie) => {
    if (item?.id) {
      // Use item's media_type if available, otherwise fallback to filter
      const type = item?.media_type === 'tv' ? 'tv' : item?.media_type === 'movie' ? 'movie' : (filter === 'tv' ? 'tv' : 'movie');
      navigation?.navigate?.('Detail', { id: item.id, type });
    }
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4].map((i) => (
            <ShimmerCard key={i} />
          ))}
        </View>
      );
    }

    if (!query?.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={colors.gray} />
          <Text style={styles.emptyText}>Film ve dizileri ara</Text>
        </View>
      );
    }

    if (results?.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="film-outline" size={64} color={colors.gray} />
          <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          <Text style={styles.emptySubtext}>Farklı anahtar kelimeler deneyin</Text>
        </View>
      );
    }

    return null;
  };

  const renderItem = ({ item }: { item: Movie }) => (
    <View style={styles.gridItem}>
      <MovieCard movie={item} onPress={() => handleMoviePress(item)} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Arama</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Film, dizi ara..."
            placeholderTextColor={colors.gray}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
          />
          {query?.length > 0 ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Hepsi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'movie' && styles.filterChipActive]}
            onPress={() => handleFilterChange('movie')}
          >
            <Text style={[styles.filterText, filter === 'movie' && styles.filterTextActive]}>
              Filmler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'tv' && styles.filterChipActive]}
            onPress={() => handleFilterChange('tv')}
          >
            <Text style={[styles.filterText, filter === 'tv' && styles.filterTextActive]}>
              Diziler
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {results && results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item?.id?.toString() ?? Math.random().toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmpty()
      )}
      
      {/* Banner Reklam - Alt kısımda */}
      <BannerAd position="bottom" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#292929',
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  logo: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
  },
  searchContainer: {
    padding: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.white,
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundCard,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.gray,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
  },
  gridItem: {
    width: '48%',
    marginBottom: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.white,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.gray,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default SearchScreen;