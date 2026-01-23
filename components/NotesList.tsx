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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export const NotesList: React.FC<NotesListProps> = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: '#3498db'  // Azul (original)
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);

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
      await NotesService.createNote(user.uid, {
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        color: newNote.color,
      });

      setNewNote({ title: '', content: '', color: colors.button.primary });
      setShowAddModal(false);
      loadNotes();
    } catch {
      Alert.alert('Error', 'No se pudo crear la nota');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.title.trim()) return;

    try {
      await NotesService.updateNote(editingNote.id, {
        title: editingNote.title.trim(),
        content: editingNote.content.trim(),
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

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[
        styles.noteItem,
        { borderLeftColor: item.color }
      ]}
      onPress={() => setEditingNote(item)}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNote(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.noteContent} numberOfLines={3}>
        {item.content}
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
    <View style={styles.colorPickerContainer}>
      <Text style={styles.colorPickerLabel}>Color de la nota:</Text>
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
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Título de la nota"
              placeholderTextColor={colors.text.secondary}
              value={newNote.title}
              onChangeText={(text) => setNewNote({ ...newNote, title: text })}
            />
            <TextInput
              style={styles.contentInput}
              placeholder="Contenido de la nota"
              placeholderTextColor={colors.text.secondary}
              multiline
              value={newNote.content}
              onChangeText={(text) => setNewNote({ ...newNote, content: text })}
              textAlignVertical="top"
            />
            {renderColorPicker(newNote.color, (color) => setNewNote({ ...newNote, color }))}
          </ScrollView>
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
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Título de la nota"
              placeholderTextColor={colors.text.secondary}
              value={editingNote?.title || ''}
              onChangeText={(text) => setEditingNote(editingNote ? { ...editingNote, title: text } : null)}
            />
            <TextInput
              style={styles.contentInput}
              placeholder="Contenido de la nota"
              placeholderTextColor={colors.text.secondary}
              multiline
              value={editingNote?.content || ''}
              onChangeText={(text) => setEditingNote(editingNote ? { ...editingNote, content: text } : null)}
              textAlignVertical="top"
            />
            {editingNote && renderColorPicker(
              editingNote.color,
              (color) => setEditingNote(editingNote ? { ...editingNote, color } : null)
            )}
          </ScrollView>
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
  colorPickerContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  colorPickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  colorOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
