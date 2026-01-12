/**
 * Data Export Screen
 * GDPR compliance - export user data
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

// Data categories that can be exported
interface DataCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  selected: boolean;
  estimatedSize?: string;
}

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'profile',
    name: 'Profile Information',
    description: 'Your name, email, bio, avatar, and account settings',
    icon: 'person-outline',
    selected: true,
    estimatedSize: '< 1 MB',
  },
  {
    id: 'posts',
    name: 'Posts & Comments',
    description: 'All posts you\'ve created and comments you\'ve made',
    icon: 'document-text-outline',
    selected: true,
    estimatedSize: '1-10 MB',
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'Your direct message conversations',
    icon: 'mail-outline',
    selected: true,
    estimatedSize: '1-50 MB',
  },
  {
    id: 'connections',
    name: 'Connections',
    description: 'Users you follow and who follow you',
    icon: 'people-outline',
    selected: true,
    estimatedSize: '< 1 MB',
  },
  {
    id: 'activity',
    name: 'Activity Log',
    description: 'Your likes, bookmarks, and interactions',
    icon: 'pulse-outline',
    selected: true,
    estimatedSize: '1-5 MB',
  },
  {
    id: 'investments',
    name: 'Investment Data',
    description: 'Your investment history and portfolio data',
    icon: 'trending-up-outline',
    selected: true,
    estimatedSize: '< 1 MB',
  },
  {
    id: 'media',
    name: 'Media Files',
    description: 'Photos and videos you\'ve uploaded',
    icon: 'images-outline',
    selected: false,
    estimatedSize: '10-500 MB',
  },
];

type ExportFormat = 'json' | 'csv' | 'html';
type ExportStatus = 'idle' | 'preparing' | 'processing' | 'ready' | 'error';

export default function DataExportScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<DataCategory[]>(DATA_CATEGORIES);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);

  const toggleCategory = useCallback((id: string) => {
    haptics.selection();
    setCategories(prev => 
      prev.map(cat => 
        cat.id === id ? { ...cat, selected: !cat.selected } : cat
      )
    );
  }, []);

  const selectAll = useCallback(() => {
    haptics.buttonPress();
    setCategories(prev => prev.map(cat => ({ ...cat, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    haptics.buttonPress();
    setCategories(prev => prev.map(cat => ({ ...cat, selected: false })));
  }, []);

  const requestExport = useCallback(async () => {
    const selectedCategories = categories.filter(c => c.selected);
    
    if (selectedCategories.length === 0) {
      Alert.alert('No Data Selected', 'Please select at least one category to export.');
      return;
    }

    haptics.buttonPress();
    setStatus('preparing');
    setProgress(0);

    try {
      // Request export from backend
      const response = await api.post('/account/export', {
        categories: selectedCategories.map(c => c.id),
        format,
      });

      if (response.data?.exportId) {
        setExportId(response.data.exportId);
        setStatus('processing');
        
        // Poll for completion
        pollExportStatus(response.data.exportId);
      } else {
        throw new Error('No export ID received');
      }
    } catch (error) {
      console.error('[DataExport] Error requesting export:', error);
      setStatus('error');
      haptics.error();
      Alert.alert(
        'Export Failed',
        'Unable to start data export. Please try again later.'
      );
    }
  }, [categories, format]);

  const pollExportStatus = useCallback(async (id: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await api.get(`/account/export/${id}/status`);
        const { status: exportStatus, progress: exportProgress, downloadUrl: url } = response.data;

        setProgress(exportProgress || 0);

        if (exportStatus === 'completed' && url) {
          setStatus('ready');
          setDownloadUrl(url);
          haptics.success();
        } else if (exportStatus === 'failed') {
          setStatus('error');
          haptics.error();
          Alert.alert('Export Failed', 'The export process encountered an error.');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setStatus('error');
          Alert.alert('Export Timeout', 'The export is taking too long. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        haptics.error();
      }
    };

    poll();
  }, []);

  const downloadExport = useCallback(async () => {
    if (!downloadUrl) return;

    haptics.buttonPress();

    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Download file
        const filename = `medinvest_data_export_${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : format === 'csv' ? 'zip' : 'html'}`;
        const fileUri = FileSystem.documentDirectory + filename;
        
        const download = await FileSystem.downloadAsync(downloadUrl, fileUri);
        
        // Share the file
        await Sharing.shareAsync(download.uri, {
          mimeType: format === 'json' ? 'application/json' : format === 'csv' ? 'application/zip' : 'text/html',
          dialogTitle: 'Save your data export',
        });
      } else {
        // Fallback to opening in browser
        Alert.alert(
          'Download Ready',
          'Your data export is ready. Would you like to open it in your browser?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: () => {/* Linking.openURL(downloadUrl) */} },
          ]
        );
      }
    } catch (error) {
      console.error('[DataExport] Error downloading:', error);
      Alert.alert('Download Failed', 'Unable to download the export file.');
    }
  }, [downloadUrl, format]);

  const resetExport = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setDownloadUrl(null);
    setExportId(null);
  }, []);

  const renderCategory = (category: DataCategory) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryItem,
        { 
          backgroundColor: colors.surface,
          borderColor: category.selected ? colors.primary : colors.border,
        },
      ]}
      onPress={() => toggleCategory(category.id)}
      disabled={status !== 'idle'}
    >
      <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={category.icon as any} size={22} color={colors.primary} />
      </View>
      <View style={styles.categoryInfo}>
        <ThemedText style={[styles.categoryName, { color: colors.textPrimary }]}>
          {category.name}
        </ThemedText>
        <ThemedText style={[styles.categoryDescription, { color: colors.textSecondary }]}>
          {category.description}
        </ThemedText>
        {category.estimatedSize && (
          <ThemedText style={[styles.categorySize, { color: colors.textSecondary }]}>
            ~{category.estimatedSize}
          </ThemedText>
        )}
      </View>
      <Ionicons
        name={category.selected ? 'checkbox' : 'square-outline'}
        size={24}
        color={category.selected ? colors.primary : colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Export Your Data
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={[styles.infoTitle, { color: colors.textPrimary }]}>
              Your data, your control
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
              Download a copy of your MedInvest data. This may take a few minutes depending on how much data you have.
            </ThemedText>
          </View>
        </View>

        {status === 'idle' && (
          <>
            {/* Category selection */}
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                SELECT DATA TO EXPORT
              </ThemedText>
              <View style={styles.selectButtons}>
                <TouchableOpacity onPress={selectAll}>
                  <ThemedText style={[styles.selectButton, { color: colors.primary }]}>
                    Select All
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.selectDivider, { color: colors.textSecondary }]}>|</ThemedText>
                <TouchableOpacity onPress={deselectAll}>
                  <ThemedText style={[styles.selectButton, { color: colors.primary }]}>
                    Deselect All
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.categoriesList}>
              {categories.map(renderCategory)}
            </View>

            {/* Format selection */}
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                EXPORT FORMAT
              </ThemedText>
            </View>
            <View style={[styles.formatSection, { backgroundColor: colors.surface }]}>
              {(['json', 'csv', 'html'] as ExportFormat[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.formatOption,
                    format === f && { backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => {
                    haptics.selection();
                    setFormat(f);
                  }}
                >
                  <Ionicons
                    name={format === f ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={format === f ? colors.primary : colors.textSecondary}
                  />
                  <View style={styles.formatInfo}>
                    <ThemedText style={[styles.formatName, { color: colors.textPrimary }]}>
                      {f.toUpperCase()}
                    </ThemedText>
                    <ThemedText style={[styles.formatDescription, { color: colors.textSecondary }]}>
                      {f === 'json' && 'Machine-readable format'}
                      {f === 'csv' && 'Spreadsheet-compatible'}
                      {f === 'html' && 'Human-readable report'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Export button */}
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.primary }]}
              onPress={requestExport}
            >
              <Ionicons name="download-outline" size={20} color="white" />
              <ThemedText style={styles.exportButtonText}>
                Request Data Export
              </ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Processing state */}
        {(status === 'preparing' || status === 'processing') && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={[styles.processingTitle, { color: colors.textPrimary }]}>
              {status === 'preparing' ? 'Preparing export...' : 'Processing your data...'}
            </ThemedText>
            <ThemedText style={[styles.processingText, { color: colors.textSecondary }]}>
              This may take a few minutes. You can leave this screen and we'll notify you when it's ready.
            </ThemedText>
            
            {/* Progress bar */}
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${progress}%` },
                ]}
              />
            </View>
            <ThemedText style={[styles.progressText, { color: colors.textSecondary }]}>
              {progress}% complete
            </ThemedText>
          </View>
        )}

        {/* Ready state */}
        {status === 'ready' && (
          <View style={styles.readyContainer}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <ThemedText style={[styles.readyTitle, { color: colors.textPrimary }]}>
              Your export is ready!
            </ThemedText>
            <ThemedText style={[styles.readyText, { color: colors.textSecondary }]}>
              Your data has been compiled and is ready to download. The download link will expire in 24 hours.
            </ThemedText>

            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: colors.primary }]}
              onPress={downloadExport}
            >
              <Ionicons name="cloud-download-outline" size={20} color="white" />
              <ThemedText style={styles.downloadButtonText}>
                Download Export
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.newExportButton, { borderColor: colors.border }]}
              onPress={resetExport}
            >
              <ThemedText style={[styles.newExportButtonText, { color: colors.textPrimary }]}>
                Request New Export
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Error state */}
        {status === 'error' && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.error} />
            <ThemedText style={[styles.errorTitle, { color: colors.textPrimary }]}>
              Export Failed
            </ThemedText>
            <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
              Something went wrong while preparing your data export. Please try again.
            </ThemedText>

            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={resetExport}
            >
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Legal info */}
        <View style={styles.legalSection}>
          <ThemedText style={[styles.legalText, { color: colors.textSecondary }]}>
            Your data export includes personal information as defined under GDPR and other privacy regulations. 
            Please store this data securely and be mindful of sharing it.
          </ThemedText>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    ...Typography.small,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  selectButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  selectButton: {
    ...Typography.small,
    fontWeight: '600',
  },
  selectDivider: {
    ...Typography.small,
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadows.card,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...Typography.body,
    fontWeight: '600',
  },
  categoryDescription: {
    ...Typography.small,
    marginTop: 2,
  },
  categorySize: {
    ...Typography.small,
    marginTop: 4,
    fontStyle: 'italic',
  },
  formatSection: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    ...Typography.body,
    fontWeight: '600',
  },
  formatDescription: {
    ...Typography.small,
    marginTop: 2,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  exportButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  processingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  processingTitle: {
    ...Typography.title,
    marginTop: Spacing.lg,
  },
  processingText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...Typography.small,
    marginTop: Spacing.sm,
  },
  readyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    ...Typography.title,
    marginTop: Spacing.lg,
  },
  readyText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  downloadButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  newExportButton: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  newExportButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    ...Typography.title,
    marginTop: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  retryButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  legalSection: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  legalText: {
    ...Typography.small,
    lineHeight: 18,
    textAlign: 'center',
  },
});
