import React, { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { Note } from '../types';
import { NotesService } from '../services/notesService';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../css/colors';

interface NotesListProps {
  onNoteSelect?: (note: Note) => void;
}

const NOTE_COLORS = [
  '#3498db',               // Azul (original)
  '#e74c3c',               // Rojo intenso
  '#2ecc71',               // Verde esmeralda
  '#f39c12',               // Naranja
  '#9b59b6',               // Púrpura
  '#1abc9c',               // Turquesa
  '#e91e63',               // Rosa fucsia
  '#34495e',               // Gris oscuro
];

const hexToRGBA = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const NotesList: React.FC<NotesListProps> = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: '#3498db',  // Azul (original)
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  const richTextRef = React.useRef<RichEditor>(null);
  const editingRichTextRef = React.useRef<RichEditor>(null);
  const scrollRef = React.useRef<ScrollView>(null);
  const editingScrollRef = React.useRef<ScrollView>(null);

  const loadNotes = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userNotes = await NotesService.getNotes(user.uid);
      setNotes(userNotes);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las notas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAddNote = async () => {
    if (!user || !newNote.title.trim()) return;

    try {
      const content = await richTextRef.current?.getContentHtml() || '';
      await NotesService.createNote(user.uid, {
        title: newNote.title.trim(),
        content: content,
        color: newNote.color,
      });

      setNewNote({
        title: '',
        content: '',
        color: colors.button.primary,
      });
      richTextRef.current?.setContentHTML('');
      setShowAddModal(false);
      loadNotes();
    } catch {
      Alert.alert('Error', 'No se pudo crear la nota');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.title.trim()) return;

    try {
      const content = await editingRichTextRef.current?.getContentHtml() || '';
      await NotesService.updateNote(editingNote.id, {
        title: editingNote.title.trim(),
        content: content,
        color: editingNote.color,
      });

      setEditingNote(null);
      loadNotes();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la nota');
    }
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Eliminar nota',
      `¿Estás seguro de que quieres eliminar "${note.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotesService.deleteNote(note.id);
              loadNotes();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la nota');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: { toDate: () => Date }) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, '');
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[
        styles.noteItem,
        {
          borderLeftColor: item.color,
          backgroundColor: hexToRGBA(item.color, 0.1)
        }
      ]}
      onPress={() => setViewingNote(item)}
      onLongPress={() => setEditingNote(item)}
      delayLongPress={500}
    >
      <View style={styles.noteHeader}>
        <Text style={[styles.noteTitle, { color: item.color }]} numberOfLines={1}>
          {item.title}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNote(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
      <Text
        style={[
          styles.noteContent,
          {
            fontSize: 14, // Preview always same size
            color: colors.text.secondary
          }
        ]}
        numberOfLines={3}
      >
        {stripHtml(item.content)}
      </Text>
      <Text style={styles.noteDate}>
        Actualizado: {formatDate(item.updatedAt)}
      </Text>
    </TouchableOpacity>
  );

  const renderColorOption = (color: string, isSelected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        isSelected && styles.colorOptionSelected
      ]}
      onPress={onPress}
    >
      {isSelected && (
        <Ionicons name="checkmark" size={16} color="#fff" />
      )}
    </TouchableOpacity>
  );

  const renderColorPicker = (selectedColor: string, onColorSelect: (color: string) => void) => (
    <View style={styles.compactColorPicker}>
      <View style={styles.colorOptionsGrid}>
        {NOTE_COLORS.map(color =>
          renderColorOption(color, selectedColor === color, () => onColorSelect(color))
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Nueva nota</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando notas...</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No tienes notas aún</Text>
              <Text style={styles.emptySubtext}>Crea tu primera nota</Text>
            </View>
          }
        />
      )}

      {/* Modal para agregar nota */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva nota</Text>
            <TouchableOpacity onPress={handleAddNote}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            style={{ flex: 1 }}
          >
            <ScrollView
              ref={scrollRef}
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[styles.titleInput, { color: newNote.color }]}
                placeholder="Título de la nota"
                placeholderTextColor={hexToRGBA(newNote.color, 0.4)}
                value={newNote.title}
                onChangeText={(text) => setNewNote({ ...newNote, title: text })}
              />

              <View style={styles.richToolbarContainer}>
                <RichToolbar
                    editor={richTextRef}
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.undo,
                        actions.redo,
                        'fontSize',
                        'foreColor',
                    ]}
                    iconMap={{
                        fontSize: ({ tintColor }: { tintColor: string }) => <Ionicons name="text" size={20} color={tintColor} />,
                        foreColor: ({ tintColor }: { tintColor: string }) => <Ionicons name="color-palette" size={20} color={tintColor} />,
                    }}
                    fontSize={() => richTextRef.current?.setFontSize(7)}
                />
              </View>

              {renderColorPicker(newNote.color, (color) => setNewNote({ ...newNote, color }))}

              <RichEditor
                  ref={richTextRef}
                  style={[styles.richEditor, { backgroundColor: hexToRGBA(newNote.color, 0.05) }]}
                  placeholder="Escribe algo increíble..."
                  initialContentHTML={newNote.content}
                  editorStyle={{
                      backgroundColor: 'transparent',
                      color: colors.text.primary,
                      contentCSSText: 'font-family: sans-serif; font-size: 16px;',
                  }}
                  onChange={(text) => setNewNote({ ...newNote, content: text })}
                  onCursorPosition={(scrollY) => {
                    scrollRef.current?.scrollTo({ y: scrollY + 80, animated: true });
                  }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal para editar nota */}
      <Modal
        visible={!!editingNote}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingNote(null)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar nota</Text>
            <TouchableOpacity onPress={handleUpdateNote}>
              <Text style={styles.saveButton}>Actualizar</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            style={{ flex: 1 }}
          >
            <ScrollView
              ref={editingScrollRef}
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[styles.titleInput, { color: editingNote?.color || colors.text.primary }]}
                placeholder="Título de la nota"
                placeholderTextColor={editingNote ? hexToRGBA(editingNote.color, 0.4) : colors.text.secondary}
                value={editingNote?.title || ''}
                onChangeText={(text) => setEditingNote(editingNote ? { ...editingNote, title: text } : null)}
              />

              <View style={styles.richToolbarContainer}>
                <RichToolbar
                    editor={editingRichTextRef}
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.undo,
                        actions.redo,
                        'fontSize',
                        'foreColor',
                    ]}
                    iconMap={{
                        fontSize: ({ tintColor }: { tintColor: string }) => <Ionicons name="text" size={20} color={tintColor} />,
                        foreColor: ({ tintColor }: { tintColor: string }) => <Ionicons name="color-palette" size={20} color={tintColor} />,
                    }}
                />
              </View>

              {editingNote && renderColorPicker(
                editingNote.color,
                (color) => setEditingNote(editingNote ? { ...editingNote, color } : null)
              )}

              <RichEditor
                  ref={editingRichTextRef}
                  style={[styles.richEditor, { backgroundColor: hexToRGBA(editingNote?.color || '#fff', 0.05) }]}
                  placeholder="Escribe algo increíble..."
                  initialContentHTML={editingNote?.content}
                  editorStyle={{
                      backgroundColor: 'transparent',
                      color: colors.text.primary,
                      contentCSSText: 'font-family: sans-serif; font-size: 16px;',
                  }}
                  onChange={(text: string) => setEditingNote(editingNote ? { ...editingNote, content: text } : null)}
                  onCursorPosition={(scrollY: number) => {
                    editingScrollRef.current?.scrollTo({ y: scrollY + 80, animated: true });
                  }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal para ver nota (Modo Lectura) */}
      <Modal
        visible={!!viewingNote}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setViewingNote(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={[styles.viewModalContainer, { backgroundColor: colors.background.primary }]}>
            <View style={styles.viewModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.viewModalTitle, { color: viewingNote?.color || colors.text.primary }]}>{viewingNote?.title}</Text>
                <Text style={styles.viewNoteDate}>{viewingNote ? formatDate(viewingNote.updatedAt) : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => setViewingNote(null)} style={styles.closeViewButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.webviewWrapper}>
              <WebView
                originWhitelist={['*']}
                source={{ html: `
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                      <style>
                        body {
                          font-family: -apple-system, system-ui;
                          color: ${colors.text.primary};
                          background-color: ${viewingNote ? hexToRGBA(viewingNote.color, 0.05) : 'transparent'};
                          padding: 20px;
                          line-height: 1.6;
                          font-size: 16px;
                          border-radius: 12px;
                        }
                        img { max-width: 100%; border-radius: 8px; }
                      </style>
                    </head>
                    <body>
                      ${viewingNote?.content || ''}
                    </body>
                  </html>
                ` }}
                style={{ backgroundColor: 'transparent' }}
              />
            </View>

            <View style={styles.viewModalFooter}>
                <TouchableOpacity
                    style={styles.editNoteButton}
                    onPress={() => {
                        const note = viewingNote;
                        setViewingNote(null);
                        setEditingNote(note);
                    }}
                >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>Editar nota</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.primary,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  notesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  noteItem: {
    backgroundColor: colors.background.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: colors.text.disabled,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.disabled,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButton: {
    fontSize: 16,
    color: colors.button.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingBottom: 12,
    marginBottom: 20,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    minHeight: 200,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  compactColorPicker: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  colorOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderColor: colors.button.primary,
    borderWidth: 2,
    transform: [{ scale: 1.2 }],
  },
  richEditor: {
    minHeight: 300,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    marginTop: 10,
  },
  richToolbarContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  viewModalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  viewModalHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    alignItems: 'center',
  },
  viewModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  viewNoteDate: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  closeViewButton: {
    padding: 8,
  },
  webviewWrapper: {
    padding: 10,
    height: 400, // Fixed height or flex approach
  },
  viewModalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    alignItems: 'center',
  },
  editNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.button.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  }
});
