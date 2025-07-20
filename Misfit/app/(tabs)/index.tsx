import {SafeAreaView, StyleSheet, ScrollView, View, Platform, StatusBar} from "react-native";
import SearchBar from '@/components/searchBar'
import { useRouter} from 'expo-router';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        textAlign:"center",
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    heading: {
        fontSize: 20,
        color: "black",
    },
    scrollContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight:"100%",
        paddingBottom:10
    },
})
export default function Index() {

    const router = useRouter();
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View>
                    <SearchBar
                        onPress={() => router.push("/catalog")}
                        placeholder={"Search Missfit"}/>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
