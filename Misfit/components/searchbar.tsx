import {View, TextInput, StyleSheet, ScrollView, Pressable} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const styles = StyleSheet.create({
    displ:{
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center'
    },
    container:{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})

interface SearchBarProps {
    placeholder: string;
    onPress?: () => void;
}
export default function SearchBar({placeholder, onPress}: SearchBarProps) {


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Pressable onPress={onPress}>
                <View style={styles.displ}>
                    <MaterialIcons name="search" color="#000" size={25} />
                    <TextInput
                        placeholder={placeholder}
                        onChangeText={() => {}}
                        value=""
                        placeholderTextColor="#000"
                        editable={false} // optional: makes it uneditable if it’s only for navigation
                    />
                </View>
            </Pressable>
        </ScrollView>
    )
}
