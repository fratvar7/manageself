import { Pressable, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';
import { GastosForm, IngresosForm } from '../../components/GastosIngresosForm';
import { MoneygerScreenStyles as moneygerStyles } from '../../css/Screens/MogeygerScreen.styles';

export default function Moneyger() {
  const [selectedType, setSelectedType] = useState('gasto');

  return (
    <View style={moneygerStyles.container}>
      <ScrollView style={{ margin: 20 }} showsVerticalScrollIndicator={false}>
        <View style={moneygerStyles.buttonsView}>
          <Pressable
            style={selectedType === 'ingreso' ? moneygerStyles.buttonSelected : moneygerStyles.button}
            onPress={() => setSelectedType('ingreso')}
          >
            <Text style={moneygerStyles.textButton}>INGRESO</Text>
          </Pressable>
          <Pressable
            style={selectedType === 'gasto' ? moneygerStyles.buttonSelected : moneygerStyles.button}
            onPress={() => setSelectedType('gasto')}
          >
            <Text style={moneygerStyles.textButton}>GASTO</Text>
          </Pressable>
        </View>
        {selectedType === 'gasto' ? <GastosForm /> : <IngresosForm />}
      </ScrollView>
    </View>
  );
}
