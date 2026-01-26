import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, TextInput } from 'react-native';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
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
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate));
  const [view, setView] = useState<'calendar' | 'month' | 'year'>('calendar');

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const selectMonth = (index: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(index);
    setCurrentMonth(newDate);
    setView('calendar');
  };

  const selectYear = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setView('calendar');
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateInGrid = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = new Date().toDateString() === dateInGrid.toDateString();
      const isSelected = initialDate.toDateString() === dateInGrid.toDateString();

      days.push(
        <Pressable
          key={day}
          style={[
            styles.day,
            isSelected && styles.selectedDay,
            isToday && !isSelected && styles.todayDay
          ]}
          onPress={() => {
            onSelectDate(dateInGrid);
            onClose();
          }}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayDayText
          ]}>
            {day}
          </Text>
        </Pressable>
      );
    }
    return days;
  };

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

          {view === 'calendar' && (
            <>
              <View style={styles.monthNavigation}>
                <Pressable onPress={() => {
                    const d = new Date(currentMonth);
                    d.setMonth(d.getMonth() - 1);
                    setCurrentMonth(d);
                }} style={styles.navBtn}>
                  <ChevronLeftIcon color={colors.text.primary} />
                </Pressable>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => setView('month')}>
                        <Text style={styles.monthText}>{MONTHS[currentMonth.getMonth()]}</Text>
                    </Pressable>
                    <Pressable onPress={() => setView('year')}>
                        <Text style={styles.monthText}>{currentMonth.getFullYear()}</Text>
                    </Pressable>
                </View>
                <Pressable onPress={() => {
                    const d = new Date(currentMonth);
                    d.setMonth(d.getMonth() + 1);
                    setCurrentMonth(d);
                }} style={styles.navBtn}>
                  <ChevronRightIcon color={colors.text.primary} />
                </Pressable>
              </View>

              <View style={styles.weekDays}>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {renderCalendarDays()}
              </View>
            </>
          )}

          {view === 'month' && (
            <View style={styles.selectionGrid}>
                <Text style={styles.selectionTitle}>Seleccionar Mes</Text>
                <View style={styles.gridItems}>
                    {MONTHS.map((m, i) => (
                        <Pressable key={m} style={[styles.gridItem, currentMonth.getMonth() === i && styles.selectedGridItem]} onPress={() => selectMonth(i)}>
                            <Text style={[styles.gridItemText, currentMonth.getMonth() === i && styles.selectedGridItemText]}>{m.substring(0, 3)}</Text>
                        </Pressable>
                    ))}
                </View>
                <Pressable style={styles.backBtn} onPress={() => setView('calendar')}>
                    <Text style={styles.backBtnText}>Volver</Text>
                </Pressable>
            </View>
          )}

          {view === 'year' && (
            <View style={styles.selectionGrid}>
                <Text style={styles.selectionTitle}>Introducir Año</Text>
                <TextInput
                    style={styles.inputYear}
                    keyboardType="numeric"
                    maxLength={4}
                    defaultValue={currentMonth.getFullYear().toString()}
                    onChangeText={(val) => {
                        if (val.length === 4) {
                            selectYear(parseInt(val));
                        }
                    }}
                    autoFocus
                />
                <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 10 }}>Ingresa 4 dígitos para cambiar</Text>
                <Pressable style={styles.backBtn} onPress={() => setView('calendar')}>
                    <Text style={styles.backBtnText}>Volver</Text>
                </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: colors.background.secondary, borderRadius: 24, width: '100%', maxWidth: 350, padding: 24, borderWidth: 1, borderColor: colors.border.default },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text.primary },
  closeBtn: { padding: 4 },
  monthNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: colors.background.tertiary, borderRadius: 12, padding: 4 },
  navBtn: { padding: 8 },
  monthText: { fontSize: 15, fontWeight: '700', color: colors.accent.primary },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekDayText: { width: 35, textAlign: 'center', fontSize: 12, color: colors.text.tertiary, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  day: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center', margin: 4, borderRadius: 10 },
  emptyDay: { width: 35, height: 35, margin: 4 },
  dayText: { color: colors.text.primary, fontSize: 14, fontWeight: '500' },
  selectedDay: { backgroundColor: colors.accent.primary },
  selectedDayText: { color: '#fff', fontWeight: '700' },
  todayDay: { borderWidth: 1, borderColor: colors.accent.primary },
  todayDayText: { color: colors.accent.primary, fontWeight: '700' },
  selectionGrid: { alignItems: 'center' },
  selectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 20 },
  gridItems: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  gridItem: { width: 70, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default },
  selectedGridItem: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
  gridItemText: { color: colors.text.secondary, fontWeight: '600', fontSize: 14 },
  selectedGridItemText: { color: '#fff' },
  inputYear: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: 15,
    width: 200,
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  backBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 30, borderRadius: 10, backgroundColor: colors.background.tertiary },
  backBtnText: { color: colors.text.primary, fontWeight: '700' }
});
