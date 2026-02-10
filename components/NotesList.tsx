import React, { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { Note, NoteFolder } from '../types';
import { NotesService } from '../services/notesService';
import { NoteFoldersService } from '../services/noteFoldersService';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../css/colors';
import { ConfirmModal } from './ConfirmModal';

interface NotesListProps {
  onNoteSelect?: (note: Note) => void;
}

const NOTE_COLORS = [
  '#3498db', // Azul
  '#e74c3c', // Rojo
  '#2ecc71', // Verde
  '#f39c12', // Naranja
  '#e91e63', // Rosa
  '#fc0909b0', // Rojo
  '#14B8A6', // Teal
  '#64748B', // Gris Pizarra
  '#8B5CF6', // Violeta Vibrante
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
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null); // null = root
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    color: '#3498db',
  });
  const [newFolder, setNewFolder] = useState({
    name: '',
    color: '#3498db',
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<NoteFolder | null>(null);

  /* Removed states */

  const richTextRef = React.useRef<RichEditor>(null);
  const editingRichTextRef = React.useRef<RichEditor>(null);
  const scrollRef = React.useRef<KeyboardAwareScrollView>(null);
  const editingScrollRef = React.useRef<KeyboardAwareScrollView>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [userNotes, userFolders] = await Promise.all([
        NotesService.getNotes(user.uid),
        NoteFoldersService.getFolders(user.uid),
      ]);
      setNotes(userNotes);
      setFolders(userFolders);
    } catch {
      // console.error('Error loading notes/folders:', error);
      Alert.alert('Error', 'No se pudieron cargar las notas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNote = async () => {
    if (!user || !newNote.title.trim()) return;

    try {
      const content = await richTextRef.current?.getContentHtml() || '';
      await NotesService.createNote(user.uid, {
        title: newNote.title.trim(),
        content: content,
        color: newNote.color,
        folderId: currentFolder || undefined,
      });

      setNewNote({
        title: '',
        content: '',
        color: colors.button.primary,
      });
      richTextRef.current?.setContentHTML('');
      setShowAddModal(false);
      loadData();
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
      loadData();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la nota');
    }
  };

  const handleDeleteNote = (note: Note) => {
    setNoteToDelete(note);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      await NotesService.deleteNote(noteToDelete.id);
      setNoteToDelete(null);
      loadData();
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la nota');
    }
  };

  const handleAddFolder = async () => {
    if (!user || !newFolder.name.trim()) return;

    try {
      await NoteFoldersService.createFolder(user.uid, {
        name: newFolder.name.trim(),
        color: newFolder.color,
        parentId: currentFolder,
      });

      setNewFolder({
        name: '',
        color: '#3498db',
      });
      setShowFolderModal(false);
      loadData();
    } catch {
      Alert.alert('Error', 'No se pudo crear la carpeta');
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !editingFolder.name.trim()) return;

    try {
      await NoteFoldersService.updateFolder(editingFolder.id, {
        name: editingFolder.name.trim(),
        color: editingFolder.color,
      });

      setEditingFolder(null);
      loadData();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la carpeta');
    }
  };

  const handleDeleteFolder = (folder: NoteFolder) => {
    const notesInFolder = notes.filter(n => n.folderId === folder.id);
    const subfolders = folders.filter(f => f.parentId === folder.id);

    if (notesInFolder.length > 0 || subfolders.length > 0) {
      Alert.alert(
        'Carpeta no vacía',
        `Esta carpeta contiene ${notesInFolder.length} nota(s) y ${subfolders.length} subcarpeta(s). Elimina o mueve el contenido primero.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setFolderToDelete(folder);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      await NoteFoldersService.deleteFolder(folderToDelete.id);
      setFolderToDelete(null);
      loadData();
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la carpeta');
    }
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
    // Reemplazar saltos de línea visuales por el patrón solicitado
    let text = html.replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, ' ·· ');
    // Eliminar todas las etiquetas HTML restantes
    text = text.replace(/<[^>]*>?/gm, '');
    // Normalizar espacios y limpiar separadores duplicados
    text = text.replace(/\s+/g, ' ').replace(/( ·· )+/g, ' ·· ').trim();
    // Eliminar el patrón del principio y del final si quedaron
    if (text.startsWith('·· ')) text = text.substring(3);
    if (text.endsWith(' ··')) text = text.substring(0, text.length - 3);
    return text;
  };

  const filteredNotes = notes.filter(note => note.folderId === currentFolder);

  // Get visible folders for current level
  const visibleFolders = folders.filter(f => {
      if (currentFolder) {
          return f.parentId === currentFolder;
      }
      return !f.parentId;
  });

  // Calculate breadcrumb path
  const breadcrumbPath = useCallback(() => {
    const path: NoteFolder[] = [];
    if (!currentFolder) return path;

    let current = folders.find(f => f.id === currentFolder);
    while (current) {
        path.unshift(current);
        if (current.parentId) {
            const parentId = current.parentId;
            current = folders.find(f => f.id === parentId);
        } else {
            current = undefined;
        }
    }
    return path;
  }, [currentFolder, folders])();

  const renderFolder = ({ item }: { item: NoteFolder }) => (
    <TouchableOpacity
      style={[
        styles.folderItem,
        {
          borderLeftColor: item.color,
          backgroundColor: hexToRGBA(item.color, 0.1)
        }
      ]}
      onPress={() => setCurrentFolder(item.id)}
      onLongPress={() => setEditingFolder(item)}
      delayLongPress={500}
    >
      <View style={styles.folderHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons name="folder" size={24} color={item.color} style={{ marginRight: 12 }} />
          <Text style={[styles.folderTitle, { color: item.color }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteFolder(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.folderCount}>
        {notes.filter(n => n.folderId === item.id).length} nota(s) · {folders.filter(f => f.parentId === item.id).length} carpeta(s)
      </Text>
    </TouchableOpacity>
  );

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
            fontSize: 14,
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
      {/* Header with breadcrumb */}
      <View style={styles.breadcrumbContainer}>
        <TouchableOpacity
          onPress={() => setCurrentFolder(null)}
          style={styles.breadcrumbItem}
        >
          <Ionicons name="home" size={20} color={currentFolder ? colors.text.secondary : colors.button.primary} />
            {!currentFolder && (
            <Text style={[styles.breadcrumbText, { color: colors.button.primary, fontWeight: '700', marginLeft: 4 }]}>
                Todas las notas
            </Text>
            )}
        </TouchableOpacity>

        {breadcrumbPath.map((folder, index) => (
            <View key={folder.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                <TouchableOpacity
                    style={styles.breadcrumbItem}
                    onPress={() => setCurrentFolder(folder.id)}
                    disabled={index === breadcrumbPath.length - 1}
                >
                    <Ionicons name="folder" size={18} color={folder.color} />
                    <Text style={[
                        styles.breadcrumbText,
                        index === breadcrumbPath.length - 1 && { color: colors.button.primary, fontWeight: '700' }
                    ]}>
                        {folder.name}
                    </Text>
                </TouchableOpacity>
            </View>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.addButton, { flex: 1, marginRight: 8 }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Nueva nota</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent.violet, flex: 1, marginLeft: 8 }]}
            onPress={() => setShowFolderModal(true)}
        >
            <Ionicons name="folder-outline" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Nueva carpeta</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <>
          {visibleFolders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                  {currentFolder ? 'Subcarpetas' : 'Carpetas'}
              </Text>
              <FlatList
                data={visibleFolders}
                renderItem={renderFolder}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {currentFolder ? 'Notas en esta carpeta' : 'Notas sin carpeta'}
            </Text>
            <FlatList
              data={filteredNotes}
              renderItem={renderNote}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.notesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={64} color={colors.text.secondary} />
                  <Text style={styles.emptyText}>
                    {currentFolder ? 'No hay notas en esta carpeta' : 'No tienes notas sin carpeta'}
                  </Text>
                  <Text style={styles.emptySubtext}>Crea tu primera nota</Text>
                </View>
              }
            />
          </View>
        </>
      )}

      {/* Modal para agregar nota */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva nota</Text>
            <TouchableOpacity onPress={handleAddNote}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAwareScrollView
            ref={scrollRef}
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={100}
            enableAutomaticScroll={true}
            stickyHeaderIndices={[1]}
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
                    selectedIconTint={colors.accent.primary}
                    iconTint={colors.text.secondary}
                    selectedButtonStyle={{ backgroundColor: colors.accent.primarySoft, borderRadius: 12 }}
                    style={{ backgroundColor: 'transparent' }}
                    flatContainerStyle={{ paddingHorizontal: 8, gap: 4 }}
                    actions={[
                        actions.undo,
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.heading2,
                        actions.heading3,
                        actions.setParagraph,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.redo,
                    ]}
                    iconMap={{
                        [actions.heading2]: ({ tintColor }: { tintColor: string }) => <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 16 }}>H1</Text>,
                        [actions.heading3]: ({ tintColor }: { tintColor: string }) => <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 14 }}>H2</Text>,
                        [actions.setParagraph]: ({ tintColor }: { tintColor: string }) => <Text style={{ color: tintColor, fontSize: 14 }}>P</Text>,
                    }}
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
                      contentCSSText: 'font-family: sans-serif; font-size: 16px; margin: 10px; padding-bottom: 40px;',
                      cssText: 'body { margin: 0; padding: 0; }',
                  }}
                  onChange={(text) => setNewNote({ ...newNote, content: text })}
                  onCursorPosition={(scrollY) => {
                    scrollRef.current?.scrollToPosition(0, Math.max(0, scrollY - 60), true);
                  }}
              />
            </KeyboardAwareScrollView>
        </View>
      </Modal>

      {/* Modal para editar nota */}
      <Modal
        visible={!!editingNote}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingNote(null)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar nota</Text>
            <TouchableOpacity onPress={handleUpdateNote}>
              <Text style={styles.saveButton}>Actualizar</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAwareScrollView
            ref={editingScrollRef}
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={100}
            enableAutomaticScroll={true}
            stickyHeaderIndices={[1]}
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
                    selectedIconTint={colors.accent.primary}
                    iconTint={colors.text.secondary}
                    selectedButtonStyle={{ backgroundColor: colors.accent.primarySoft, borderRadius: 12 }}
                    style={{ backgroundColor: 'transparent' }}
                    flatContainerStyle={{ paddingHorizontal: 8, gap: 4 }}
                    actions={[
                        actions.undo,
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.heading2,
                        actions.heading3,
                        actions.setParagraph,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.redo,
                    ]}
                    iconMap={{
                        [actions.heading2]: ({ tintColor }: { tintColor: string }) => <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 16 }}>H1</Text>,
                        [actions.heading3]: ({ tintColor }: { tintColor: string }) => <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 14 }}>H2</Text>,
                        [actions.setParagraph]: ({ tintColor }: { tintColor: string }) => <Text style={{ color: tintColor, fontSize: 14 }}>P</Text>,
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
                      contentCSSText: 'font-family: sans-serif; font-size: 16px; margin: 10px; padding-bottom: 40px;',
                      cssText: 'body { margin: 0; padding: 0; }',
                  }}
                  onChange={(text: string) => setEditingNote(editingNote ? { ...editingNote, content: text } : null)}
                  onCursorPosition={(scrollY: number) => {
                    editingScrollRef.current?.scrollToPosition(0, Math.max(0, scrollY - 60), true);
                  }}
              />
            </KeyboardAwareScrollView>
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

      {/* Modal para agregar/editar carpeta */}
      <Modal
        visible={showFolderModal || !!editingFolder}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowFolderModal(false);
          setEditingFolder(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={[styles.folderModalContainer, { backgroundColor: colors.background.secondary }]}>
            <Text style={styles.folderModalTitle}>
              {editingFolder ? 'Editar Carpeta' : 'Nueva Carpeta'}
            </Text>

            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.folderInput}
              placeholder="Ej. Proyectos, Ideas, Recetas..."
              placeholderTextColor={colors.text.tertiary}
              value={editingFolder ? editingFolder.name : newFolder.name}
              onChangeText={(text) => {
                if (editingFolder) {
                  setEditingFolder({ ...editingFolder, name: text });
                } else {
                  setNewFolder({ ...newFolder, name: text });
                }
              }}
              autoFocus
            />

            <Text style={styles.inputLabel}>Color</Text>
            {renderColorPicker(
              editingFolder ? editingFolder.color : newFolder.color,
              (color) => {
                if (editingFolder) {
                  setEditingFolder({ ...editingFolder, color });
                } else {
                  setNewFolder({ ...newFolder, color });
                }
              }
            )}

            <View style={styles.folderModalActions}>
              <TouchableOpacity
                style={[styles.folderModalButton, { backgroundColor: colors.background.tertiary }]}
                onPress={() => {
                  setShowFolderModal(false);
                  setEditingFolder(null);
                  setNewFolder({ name: '', color: '#3498db' });
                }}
              >
                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.folderModalButton, { backgroundColor: colors.button.primary }]}
                onPress={editingFolder ? handleUpdateFolder : handleAddFolder}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {editingFolder ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!noteToDelete}
        title="Eliminar nota"
        message={`¿Estás seguro de que quieres eliminar la nota "${noteToDelete?.title}"?`}
        onConfirm={confirmDeleteNote}
        onCancel={() => setNoteToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />

      <ConfirmModal
        visible={!!folderToDelete}
        title="Eliminar carpeta"
        message={`¿Estás seguro de que quieres eliminar la carpeta "${folderToDelete?.name}"?`}
        onConfirm={confirmDeleteFolder}
        onCancel={() => setFolderToDelete(null)}
        confirmText="Eliminar"
        isDestructive={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breadcrumbText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingBottom: 20,
  },
  folderItem: {
    backgroundColor: colors.background.card,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  folderTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  folderCount: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  noteItem: {
    backgroundColor: colors.background.card,
    padding: 16,
    marginHorizontal: 16,
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
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
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
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    height: 400,
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
  },
  folderModalContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
  },
  folderModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  folderInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  folderModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  folderModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
