import { Pressable } from 'react-native';
import { HeadIcon } from './Icons';
import { router } from 'expo-router';

export default function Account() {

  const handleOnPress = () => {
    router.push('/account');
  };

  return (
    <Pressable style={{ marginRight: 10 }} onPress={handleOnPress}>
      <HeadIcon />
    </Pressable>
  );
}
