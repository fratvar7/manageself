import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../css/colors';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date;
  title?: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate = new Date(),
  title = "Seleccionar fecha"
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date(initialDate));

  // Update state when initialDate changes or modal opens
  useEffect(() => {
    if (visible) {
        setSelectedDate(new Date(initialDate));
    }
  }, [visible, initialDate]);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i); // Current year + 10

  const handleDaySelect = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(monthIndex);
    // Adjust logic to prevent overflow (e.g. going from Jan 31 to Feb -> Feb 28/29)
    // Date object handles this by overflowing to next month, so we might need to clamp
    if (newDate.getMonth() !== monthIndex) {
        newDate.setDate(0); // Set to last day of previous month (which is the intended month)
    }
    setSelectedDate(newDate);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
  };

  const renderColumn = (items: (string | number)[], selectedItem: string | number, onSelect: (val: number) => void, width: number) => (
    <View style={[styles.column, { width }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 20 }}>
        {items.map((item, index) => {
           let isSelected = false;
           if (typeof item === 'string') {
               // For months
               isSelected = MONTHS.indexOf(item) === selectedDate.getMonth();
           } else {
                // For days and years
                if (width < 80) { // Day column heuristic
                    isSelected = item === selectedDate.getDate();
                } else {
                    isSelected = item === selectedDate.getFullYear();
                }
           }

           return (
            <Pressable
                key={index}
                style={[styles.pickerItem, isSelected && styles.selectedPickerItem]}
                onPress={() => {
                    if (typeof item === 'string') {
                         onSelect(MONTHS.indexOf(item));
                    } else {
                         onSelect(item);
                    }
                }}
            >
                <Text style={[styles.pickerItemText, isSelected && styles.selectedPickerItemText]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
          </View>

          <View style={styles.pickerContainer}>
            {/* Days */}
            <View style={styles.columnContainer}>
                <Text style={styles.columnLabel}>Día</Text>
                 {renderColumn(days, selectedDate.getDate(), handleDaySelect, 60)}
            </View>

            {/* Months */}
            <View style={styles.columnContainer}>
                <Text style={styles.columnLabel}>Mes</Text>
                {renderColumn(MONTHS, MONTHS[selectedDate.getMonth()], handleMonthSelect, 110)}
            </View>

            {/* Years */}
            <View style={styles.columnContainer}>
                <Text style={styles.columnLabel}>Año</Text>
                {renderColumn(years, selectedDate.getFullYear(), handleYearSelect, 80)}
            </View>
          </View>

          <View style={styles.footer}>
             <Pressable style={styles.confirmButton} onPress={() => {
                 onSelectDate(selectedDate);
                 onClose();
             }}>
                 <Text style={styles.confirmButtonText}>Confirmar</Text>
             </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: colors.background.secondary, borderRadius: 24, width: '100%', maxWidth: 350, padding: 24, borderWidth: 1, borderColor: colors.border.default, maxHeight: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text.primary },
  closeBtn: { padding: 4 },

  pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 250, marginBottom: 20 },
  columnContainer: { alignItems: 'center' },
  columnLabel: { color: colors.text.tertiary, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  column: { backgroundColor: colors.background.tertiary, borderRadius: 12, height: '100%' },

  pickerItem: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  selectedPickerItem: { backgroundColor: colors.accent.primary + '20', marginHorizontal: 4, borderRadius: 8 },
  pickerItemText: { color: colors.text.secondary, fontSize: 16, fontWeight: '500' },
  selectedPickerItemText: { color: colors.accent.primary, fontWeight: '700', fontSize: 17 },

  footer: { marginTop: 10 },
  confirmButton: { backgroundColor: colors.accent.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
