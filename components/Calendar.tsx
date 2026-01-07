
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { CalendarStyles } from '../css/Components/Calendar.styles';
import { colors } from '../css/colors';

interface CalendarProps {
  selectedDate: string;
  onDateChange: (_date: string) => void;
}

export default function Calendar({ selectedDate, onDateChange }: CalendarProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date): string => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[date.getMonth()];
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);

    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }

    onDateChange(formatDate(newDate));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const selectDate = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateChange(formatDate(selected));
    setShowModal(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === formatDate(new Date());

      days.push(
        <Pressable
          key={day}
          style={[
            styles.day,
            isSelected && styles.selectedDay,
            isToday && styles.todayDay
          ]}
          onPress={() => selectDate(day)}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isToday && styles.todayDayText
          ]}>
            {day}
          </Text>
        </Pressable>
      );
    }

    return days;
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  return (
    <View style={styles.container}>
      {/* Header con navegación de días */}
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={() => navigateDay('prev')}>
          <ChevronLeftIcon color={colors.text.primary} />
        </Pressable>

        <Pressable style={styles.dateDisplay} onPress={() => setShowModal(true)}>
          <CalendarIcon color={colors.text.primary} />
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={() => navigateDay('next')}>
          <ChevronRightIcon color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Modal del calendario */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable style={styles.closeButton} onPress={() => setShowModal(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Seleccionar fecha</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Navegación de meses */}
            <View style={styles.monthNavigation}>
              <Pressable onPress={() => navigateMonth('prev')}>
                <ChevronLeftIcon color={colors.text.primary} />
              </Pressable>
              <Text style={styles.monthText}>
                {getMonthName(currentMonth)} {currentMonth.getFullYear()}
              </Text>
              <Pressable onPress={() => navigateMonth('next')}>
                <ChevronRightIcon color={colors.text.primary} />
              </Pressable>
            </View>

            {/* Días de la semana */}
            <View style={styles.weekDays}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            {/* Calendario */}
            <View style={styles.calendarGrid}>
              {renderCalendarDays()}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};


const styles = CalendarStyles;

